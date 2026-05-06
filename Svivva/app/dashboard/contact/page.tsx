"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

export default function ContactPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Open default email client with pre-filled information
      const body = `Name: ${name}\nEmail: ${email}\n\n${message}`;
      const mailtoLink = `mailto:hello@svivva.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailtoLink;

      toast({
        title: "Email client opened",
        description: "Please send the email to complete your message.",
      });

      // Reset form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to open email client",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Contact Us</h1>
        <p className="text-muted-foreground">Send us a message at hello@svivva.com</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Send a Message</CardTitle>
          <CardDescription>
            Fill out the form below and we'll get back to you as soon as possible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="input-contact-name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Email
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="input-contact-email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Subject
              </label>
              <input
                type="text"
                placeholder="What is this about?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="input-contact-subject"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">
                Message
              </label>
              <textarea
                placeholder="Your message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                data-testid="textarea-contact-message"
              />
            </div>

            <Button
              type="submit"
              disabled={sending}
              className="w-full"
              data-testid="button-send-contact"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Send className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
              Email: hello@svivva.com
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              We typically respond within 24 hours. For urgent matters, please mention that in your message.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
