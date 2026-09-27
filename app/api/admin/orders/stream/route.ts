import { NextRequest, NextResponse } from "next/server";
import { fetchTokenDetails } from "@/lib/fetchTokenDetails";
import { databaseConnection } from "@/config/databseConnection";
import User from "@/models/user.model";
import { subscribeToOrderEvents, RealtimeOrderPayload } from "@/lib/orderEvents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    await databaseConnection();

    // 1. Authenticate Admin
    const decoded = await fetchTokenDetails(request);
    if (!decoded || !decoded.userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized: Admin authentication required" },
        { status: 401 },
      );
    }

    const adminUser = (await User.findById(decoded.userId).select("role").lean()) as any;
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json(
        { success: false, message: "Forbidden: Admin privileges required" },
        { status: 403 },
      );
    }

    const encoder = new TextEncoder();

    // 2. Create SSE Stream
    const stream = new ReadableStream({
      start(controller) {
        // Send initial confirmation
        const initialPayload = JSON.stringify({
          type: "connected",
          message: "Real-time admin order stream established",
          timestamp: new Date().toISOString(),
        });
        controller.enqueue(encoder.encode(`event: connected\ndata: ${initialPayload}\n\n`));

        // Subscribe to real-time order emitter
        const unsubscribe = subscribeToOrderEvents((order: RealtimeOrderPayload) => {
          try {
            const dataStr = JSON.stringify(order);
            controller.enqueue(encoder.encode(`event: new_order\ndata: ${dataStr}\n\n`));
          } catch (err) {
            console.error("[SSE] Error encoding new_order event:", err);
          }
        });

        // 15-second heartbeat to prevent idle connection dropouts
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat ${Date.now()}\n\n`));
          } catch {
            clearInterval(heartbeatInterval);
          }
        }, 15000);

        // Cleanup on abort/disconnect
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeatInterval);
          unsubscribe();
          try {
            controller.close();
          } catch {}
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform, no-store",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[SSE] Error establishing admin orders stream:", error);
    return NextResponse.json(
      { success: false, message: "Failed to establish real-time stream" },
      { status: 500 },
    );
  }
}
