"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Share2, Copy, Check } from "lucide-react";
import QRCode from "qrcode";

interface ShareRoomButtonProps {
  gameCode: string;
  className?: string;
}

export default function ShareRoomButton({ gameCode, className }: ShareRoomButtonProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [gameUrl, setGameUrl] = useState("");

  useEffect(() => {
    setGameUrl(window.location.href);
  }, [gameCode]);

  useEffect(() => {
    if (isOpen) {
      QRCode.toDataURL(gameUrl, {
        width: 200,
        margin: 2,
      })
        .then(url => setQrCodeUrl(url))
        .catch(console.error);
    }
  }, [gameUrl, isOpen]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Game Room</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* QR Code */}
          <div className="flex justify-center">
            {qrCodeUrl ? (
              <img
                src={qrCodeUrl}
                alt="QR Code for game room"
                className="rounded-lg border"
              />
            ) : (
              <div className="w-[200px] h-[200px] bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Generating QR code...</span>
              </div>
            )}
          </div>

          {/* URL with copy button */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Game Room URL:</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={gameUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
              />
              <Button
                size="sm"
                onClick={copyToClipboard}
                variant="outline"
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-sm text-green-600">URL copied to clipboard!</p>
            )}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            Share this QR code or URL with players to join the game room.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}