import { NextRequest, NextResponse } from "next/server";
import { getHostSession } from "@/lib/host-auth";
import { generateReport } from "@/lib/excel";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { TORONTO_TZ } from "@/lib/utils";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  const hostSession = await getHostSession(request);
  if (!hostSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let startUTC: Date;
  let endUTC: Date;

  if (from && to) {
    const [fy, fm, fd] = from.split("-").map(Number);
    const [ty, tm, td] = to.split("-").map(Number);
    startUTC = fromZonedTime(new Date(fy, fm - 1, fd, 0, 0, 0), TORONTO_TZ);
    endUTC = fromZonedTime(new Date(ty, tm - 1, td, 23, 59, 59), TORONTO_TZ);
  } else {
    // Default: last 30 days
    const nowToronto = toZonedTime(new Date(), TORONTO_TZ);
    endUTC = fromZonedTime(
      new Date(nowToronto.getFullYear(), nowToronto.getMonth(), nowToronto.getDate(), 23, 59, 59),
      TORONTO_TZ
    );
    const startToronto = new Date(nowToronto);
    startToronto.setDate(nowToronto.getDate() - 30);
    startUTC = fromZonedTime(
      new Date(startToronto.getFullYear(), startToronto.getMonth(), startToronto.getDate(), 0, 0, 0),
      TORONTO_TZ
    );
  }

  const buffer = await generateReport(startUTC, endUTC);
  const filename = `timapp-report-${format(new Date(), "yyyy-MM-dd")}.xlsx`;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
