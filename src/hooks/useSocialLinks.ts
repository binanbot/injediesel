import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SocialLinks {
  facebook: string;
  instagram: string;
  tiktok: string;
  shop: string;
}

export function useSocialLinks() {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({
    facebook: "",
    instagram: "",
    tiktok: "",
    shop: "",
  });
  const [loading, setLoading] = useState(true);

  const fetchSocialLinks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("system_settings")
      .select("key, value")
      .in("key", ["social_facebook", "social_instagram", "social_tiktok", "social_shop"]);

    if (!error && data) {
      const links: SocialLinks = {
        facebook: "",
        instagram: "",
        tiktok: "",
        shop: "",
      };
      
      data.forEach((item) => {
        if (item.key === "social_facebook") links.facebook = item.value || "";
        if (item.key === "social_instagram") links.instagram = item.value || "";
        if (item.key === "social_tiktok") links.tiktok = item.value || "";
        if (item.key === "social_shop") links.shop = item.value || "";
      });
      
      setSocialLinks(links);
    }
    setLoading(false);
  };

  const updateSocialLinks = async (links: SocialLinks) => {
    const updates = [
      { key: "social_facebook", value: links.facebook },
      { key: "social_instagram", value: links.instagram },
      { key: "social_tiktok", value: links.tiktok },
      { key: "social_shop", value: links.shop },
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from("system_settings")
        .update({ value: update.value })
        .eq("key", update.key);

      if (error) {
        console.error(`Error updating ${update.key}:`, error);
        return false;
      }
    }

    setSocialLinks(links);
    return true;
  };

  useEffect(() => {
    fetchSocialLinks();
  }, []);

  return { socialLinks, loading, updateSocialLinks, refetch: fetchSocialLinks };
}
