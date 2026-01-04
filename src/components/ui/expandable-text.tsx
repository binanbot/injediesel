import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
  className?: string;
  expandedClassName?: string;
}

export function ExpandableText({
  text,
  maxLength = 100,
  className,
  expandedClassName,
}: ExpandableTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > maxLength;
  
  const displayText = isExpanded || !shouldTruncate 
    ? text 
    : text.slice(0, maxLength).trim() + "...";

  return (
    <div className={cn("space-y-1", className)}>
      <p className={cn(
        "text-sm text-foreground whitespace-pre-wrap",
        isExpanded && expandedClassName
      )}>
        {displayText}
      </p>
      {shouldTruncate && (
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Ver menos
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Ver mais
            </>
          )}
        </Button>
      )}
    </div>
  );
}

interface TicketContentBlockProps {
  resumo?: string;
  detalhes?: string;
  className?: string;
}

export function TicketContentBlock({
  resumo,
  detalhes,
  className,
}: TicketContentBlockProps) {
  const [showDetalhes, setShowDetalhes] = useState(false);

  return (
    <div className={cn("space-y-2", className)}>
      {resumo && (
        <p className="text-sm font-medium text-foreground line-clamp-1">
          {resumo}
        </p>
      )}
      {detalhes && (
        <div className="space-y-1">
          {showDetalhes ? (
            <>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {detalhes}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetalhes(false);
                }}
              >
                <ChevronUp className="h-3 w-3 mr-1" />
                Ocultar detalhes
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {detalhes}
              </p>
              {detalhes.length > 100 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-primary hover:text-primary/80 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetalhes(true);
                  }}
                >
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Ver detalhes
                </Button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface TechnicalDetailsProps {
  items: { label: string; value: string }[];
  className?: string;
}

export function TechnicalDetails({ items, className }: TechnicalDetailsProps) {
  return (
    <ul className={cn("space-y-1 text-sm", className)}>
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <span className="text-primary mt-1.5">•</span>
          <span className="flex-1">
            <span className="text-muted-foreground">{item.label}:</span>{" "}
            <span className="text-foreground font-medium">{item.value}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
