import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck } from "lucide-react"

interface AttendanceListProps {
  attendance: string[]
}

export default function AttendanceList({ attendance }: AttendanceListProps) {
  return (
    <ScrollArea className="h-[400px] w-full scrollbar-thin">
      <Table>
        <TableHeader>
          <TableRow className="border-b hover:bg-transparent">
            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pl-5">Person</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Time</TableHead>
            <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendance.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={3} className="py-16 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    <UserCheck size={18} className="text-muted-foreground/60" />
                  </div>
                  <p className="text-sm font-medium">No records yet</p>
                  <p className="text-xs">Start attendance to see records appear here</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            attendance.map((entry, index) => (
              <TableRow key={index} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                <TableCell className="py-3 pl-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-blue-700">H</span>
                    </div>
                    <span className="text-sm font-medium">Hizikyas</span>
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <span className="text-sm text-muted-foreground font-mono text-xs">
                    {entry.split(" at ")[1]}
                  </span>
                </TableCell>
                <TableCell className="py-3">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />
                    Present
                  </span>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

