import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Facebook, Twitter, MessageCircle, Mail, Link2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  url: string;
}

export default function ShareModal({ open, onOpenChange, title, url }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const fullUrl = `${window.location.origin}${url}`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedTitle = encodeURIComponent(title);

  const copyLink = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    toast({ title: "Link copied!", description: "Document link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:bg-[hsl(142,60%,45%)]/10 hover:text-[hsl(142,60%,45%)]",
    },
    {
      name: "Twitter",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      color: "hover:bg-[hsl(200,90%,50%)]/10 hover:text-[hsl(200,90%,50%)]",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:bg-[hsl(220,60%,50%)]/10 hover:text-[hsl(220,60%,50%)]",
    },
    {
      name: "Email",
      icon: Mail,
      href: `mailto:?subject=${encodedTitle}&body=Check%20out%20this%20document%20on%20UniHub:%20${encodedUrl}`,
      color: "hover:bg-primary/10 hover:text-primary",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display">Share Document</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground truncate">{title}</p>

        <div className="grid grid-cols-4 gap-3 mt-2">
          {socialLinks.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-muted-foreground transition-colors ${s.color}`}
            >
              <s.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{s.name}</span>
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <div className="relative flex-1">
            <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={fullUrl} readOnly className="pl-9 pr-3 text-xs" />
          </div>
          <Button size="sm" variant="outline" className="gap-1.5 shrink-0" onClick={copyLink}>
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
