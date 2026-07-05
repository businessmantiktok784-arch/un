import { Info } from "lucide-react";

interface FairUseNoticeProps {
  uploaderName?: string;
}

export default function FairUseNotice({ uploaderName }: FairUseNoticeProps) {
  return (
    <div className="flex gap-2.5 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
      <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
      <p className="leading-relaxed">
        Shared by{" "}
        <span className="font-medium text-foreground">{uploaderName || "a student"}</span> for
        peer-to-peer educational use under fair-use principles. Rights remain with the original
        authors and institutions. To report a concern, please use the Contact page.
      </p>
    </div>
  );
}

