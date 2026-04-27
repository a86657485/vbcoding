export function extractHtmlCode(text: string) {
  const match = text.match(/```html\s*([\s\S]*?)```/i);
  return match?.[1]?.trim() ?? "";
}
