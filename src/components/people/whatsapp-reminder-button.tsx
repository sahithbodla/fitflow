import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { whatsAppHref } from "@/lib/leads/phone";

/**
 * Opens WhatsApp with a pre-filled renewal reminder already typed in — the
 * message still needs a human tap to actually send, nothing goes out on its
 * own. Renders nothing without a phone number to send to.
 */
export function WhatsAppReminderButton({
  phone,
  message,
  label = "Send renewal reminder",
}: {
  phone: string;
  message: string;
  label?: string;
}) {
  if (!phone) return null;

  return (
    <Button asChild size="sm" variant="outline" className="gap-1.5">
      <a href={whatsAppHref(phone, message)} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="size-4" />
        {label}
      </a>
    </Button>
  );
}
