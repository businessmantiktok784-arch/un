import { useState } from "react";
import { Heart, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useDonationSettings } from "@/hooks/useLiveData";

export default function DonationWidget() {
  const { donationSettings, loading } = useDonationSettings();
  const [copied, setCopied] = useState(false);

  const momoNumber = donationSettings?.momo_number;
  const momoName = donationSettings?.momo_name;
  const enabled = donationSettings?.enabled;

  if (!enabled) return null;

  const copy = async () => {
    if (!momoNumber) return;
    await navigator.clipboard.writeText(momoNumber.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Heart className="h-4 w-4 text-destructive" /> Support UniHub
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Heart className="h-5 w-5 text-destructive" /> Keep UniHub free for students
          </DialogTitle>
          <DialogDescription>
            UniHub is free to use. Your contribution covers servers, AI costs, and lets us add
            more features. Any amount helps — even 500 RWF.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {loading ? (
            <div className="rounded-xl border bg-primary/5 p-4 text-center text-sm text-muted-foreground">
              Loading donation details...
            </div>
          ) : momoNumber ? (
            <div className="rounded-xl border bg-primary/5 p-4 space-y-2">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">MTN Mobile Money</p>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-display text-xl font-bold text-foreground">{momoNumber}</p>
                  {momoName && <p className="text-sm text-muted-foreground">{momoName}</p>}
                </div>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={copy}>
                  {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border bg-primary/5 p-4 text-center text-sm text-muted-foreground">
              Donation details not yet configured.
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Dial *182*1*1*number*amount# on your phone or use the MTN MoMo app. Thank you 💚
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
