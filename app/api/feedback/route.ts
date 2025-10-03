import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { name, comment, context } = await request.json();

    console.log("[API] Received feedback:", { name, comment, context });

    // Validate inputs
    if (!name || name.trim().length === 0) {
      console.error("[API] Validation error: Name is required");
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!comment || comment.trim().length === 0) {
      console.error("[API] Validation error: Comment is required");
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }

    // Check if Resend API key is configured
    if (!process.env.RESEND_API_KEY) {
      console.error("[API] RESEND_API_KEY not configured");
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    // Send email via Resend
    console.log("[API] Sending feedback email...");
    const { data, error } = await resend.emails.send({
      from: "Game Platform Feedback <onboarding@resend.dev>",
      to: "primary@d6a.dev",
      subject: `Feedback from ${name}${context ? ` - ${context}` : ""}`,
      text: `
Feedback Submission
==================

Name: ${name}
${context ? `Context: ${context}\n` : ""}
Comment:
${comment}

---
Submitted at: ${new Date().toISOString()}
      `.trim(),
      html: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; color: #1f2937; }
    .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e5e7eb; }
    .comment { white-space: pre-wrap; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">New Feedback Submission</h2>
    </div>
    <div class="content">
      <div class="field">
        <div class="label">Name:</div>
        <div class="value">${name}</div>
      </div>
      ${context ? `
      <div class="field">
        <div class="label">Context:</div>
        <div class="value">${context}</div>
      </div>
      ` : ""}
      <div class="field">
        <div class="label">Comment:</div>
        <div class="value comment">${comment}</div>
      </div>
      <div class="footer">
        Submitted at: ${new Date().toLocaleString()}
      </div>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });

    if (error) {
      console.error("[API] Resend error:", error);
      return NextResponse.json(
        { error: "Failed to send feedback" },
        { status: 500 }
      );
    }

    console.log("[API] Feedback email sent successfully:", data);
    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("[API] Error processing feedback:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to submit feedback",
      },
      { status: 500 }
    );
  }
}
