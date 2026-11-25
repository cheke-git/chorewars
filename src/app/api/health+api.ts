export function GET() {
  return Response.json({
    status: 'ok',
    app: 'chorewars',
    timestamp: new Date().toISOString(),
  });
}
