import { useState, useRef } from "react";
import { Upload, FileText, Check, X, AlertCircle, Download, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CSVRow {
  email: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  cpf?: string;
  cnpj?: string;
  start_date?: string;
  equipment_type?: string;
  is_prepaid?: string;
  rental_value_brl?: string;
  allow_manual_credits?: string;
  kess_serial?: string;
  kess_expires_at?: string;
  ktag_serial?: string;
  ktag_expires_at?: string;
  legacy_user_login?: string;
  legacy_source_user_id?: string;
  legacy_role?: string;
  legacy_user_registered_at?: string;
}

interface ValidationResult {
  row: CSVRow;
  rowIndex: number;
  isValid: boolean;
  errors: string[];
}

interface ImportResult {
  success: boolean;
  email: string;
  error?: string;
  action: "created" | "updated" | "skipped";
}

export default function ImportarFranqueados() {
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [contractExpirationDate, setContractExpirationDate] = useState("2026-12-31");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/"/g, ""));
    
    return lines.slice(1).map(line => {
      const values: string[] = [];
      let current = "";
      let inQuotes = false;

      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });

      return row as unknown as CSVRow;
    });
  };

  const validateEmail = (email: string): boolean => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validateRows = async (rows: CSVRow[]): Promise<ValidationResult[]> => {
    const results: ValidationResult[] = [];
    const seenEmails = new Set<string>();
    const seenLegacyIds = new Set<string>();

    // Fetch existing emails from database
    const { data: existingProfiles } = await supabase
      .from("profiles_franchisees")
      .select("email, legacy_source_user_id");

    const existingEmails = new Set(existingProfiles?.map(p => p.email.toLowerCase()) || []);
    const existingLegacyIds = new Set(
      existingProfiles?.filter(p => p.legacy_source_user_id).map(p => p.legacy_source_user_id) || []
    );

    rows.forEach((row, index) => {
      const errors: string[] = [];
      const email = row.email?.trim().toLowerCase();

      // Email validation
      if (!email) {
        errors.push("Email obrigatório");
      } else if (!validateEmail(email)) {
        errors.push("Email inválido");
      } else if (seenEmails.has(email)) {
        errors.push("Email duplicado no CSV");
      } else if (existingEmails.has(email)) {
        // Not an error, just info - will update existing
      }

      if (email) seenEmails.add(email);

      // Legacy ID check
      const legacyId = row.legacy_source_user_id?.trim();
      if (legacyId) {
        if (seenLegacyIds.has(legacyId)) {
          errors.push("ID legado duplicado no CSV");
        } else if (existingLegacyIds.has(legacyId)) {
          // Not an error - will update
        }
        seenLegacyIds.add(legacyId);
      }

      results.push({
        row,
        rowIndex: index + 2, // +2 for header and 1-based
        isValid: errors.length === 0,
        errors
      });
    });

    return results;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast.error("Por favor, selecione um arquivo CSV");
      return;
    }

    setFile(selectedFile);
    setIsValidating(true);
    setImportResults([]);

    try {
      const text = await selectedFile.text();
      const rows = parseCSV(text);
      setCsvData(rows);

      const results = await validateRows(rows);
      setValidationResults(results);

      const validCount = results.filter(r => r.isValid).length;
      const invalidCount = results.filter(r => !r.isValid).length;

      if (invalidCount > 0) {
        toast.warning(`${validCount} válidos, ${invalidCount} com erros`);
      } else {
        toast.success(`${validCount} registros prontos para importar`);
      }
    } catch (error) {
      toast.error("Erro ao processar o arquivo CSV");
      console.error(error);
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    const validRows = validationResults.filter(r => r.isValid).map(r => r.row);
    
    if (validRows.length === 0) {
      toast.error("Nenhum registro válido para importar");
      return;
    }

    setIsImporting(true);
    setImportProgress(0);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      // Send to edge function
      const response = await supabase.functions.invoke("import-franchisees", {
        body: {
          franchisees: validRows,
          contractExpirationDate
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const result = response.data;
      setImportResults(result.results);
      setImportProgress(100);

      toast.success(
        `Importação concluída: ${result.created} criados, ${result.updated} atualizados, ${result.skipped} ignorados`
      );
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Erro na importação: " + (error instanceof Error ? error.message : "Erro desconhecido"));
    } finally {
      setIsImporting(false);
    }
  };

  const downloadErrors = () => {
    const invalidRows = validationResults.filter(r => !r.isValid);
    if (invalidRows.length === 0) return;

    const csvContent = [
      "linha,email,erros",
      ...invalidRows.map(r => 
        `${r.rowIndex},"${r.row.email || ""}","${r.errors.join("; ")}"`
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "erros_importacao.csv";
    link.click();
  };

  const validCount = validationResults.filter(r => r.isValid).length;
  const invalidCount = validationResults.filter(r => !r.isValid).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Importar Franqueados</h1>
        <p className="text-muted-foreground">
          Importe franqueados em massa via arquivo CSV
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upload Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de CSV
            </CardTitle>
            <CardDescription>
              Selecione o arquivo CSV com os dados dos franqueados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                {file ? file.name : "Clique para selecionar ou arraste o arquivo CSV"}
              </p>
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contractDate">Data de Vencimento do Contrato</Label>
              <Input
                id="contractDate"
                type="date"
                value={contractExpirationDate}
                onChange={(e) => setContractExpirationDate(e.target.value)}
              />
            </div>

            {isValidating && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando dados...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Resumo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{csvData.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <p className="text-2xl font-bold text-green-500">{validCount}</p>
                <p className="text-sm text-muted-foreground">Válidos</p>
              </div>
              <div className="text-center p-4 bg-destructive/10 rounded-lg">
                <p className="text-2xl font-bold text-destructive">{invalidCount}</p>
                <p className="text-sm text-muted-foreground">Com Erros</p>
              </div>
            </div>

            {invalidCount > 0 && (
              <Button variant="outline" size="sm" onClick={downloadErrors} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Baixar Relatório de Erros
              </Button>
            )}

            {validCount > 0 && (
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar {validCount} Franqueados
                  </>
                )}
              </Button>
            )}

            {isImporting && (
              <Progress value={importProgress} className="h-2" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      {validationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview dos Dados (primeiras 20 linhas)</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Login Legado</TableHead>
                    <TableHead>Erros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {validationResults.slice(0, 20).map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {result.isValid ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {result.row.email}
                      </TableCell>
                      <TableCell>
                        {result.row.display_name || `${result.row.first_name || ""} ${result.row.last_name || ""}`}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {result.row.cpf || result.row.cnpj || "-"}
                      </TableCell>
                      <TableCell>{result.row.legacy_user_login || "-"}</TableCell>
                      <TableCell>
                        {result.errors.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.errors.map((error, i) => (
                              <Badge key={i} variant="destructive" className="text-xs">
                                {error}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Import Results */}
      {importResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Status</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importResults.map((result, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {result.success ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-destructive" />
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {result.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            result.action === "created"
                              ? "default"
                              : result.action === "updated"
                              ? "secondary"
                              : "destructive"
                          }
                        >
                          {result.action === "created"
                            ? "Criado"
                            : result.action === "updated"
                            ? "Atualizado"
                            : "Ignorado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {result.error || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
