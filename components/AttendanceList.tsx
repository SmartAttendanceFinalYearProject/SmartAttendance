import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck, Smile, PersonStanding } from "lucide-react"

interface AttendanceRecord {
  student_id: string;
  full_name: string;
  status: string;
  emotion?: string;
  pose?: string;
  timestamp: string;
}

interface AttendanceListProps {
  records: AttendanceRecord[]
}

export default function AttendanceList({ records }: AttendanceListProps) {
  return (
    <ScrollArea className="h-[450px] w-full scrollbar-thin">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-white/5 hover:bg-transparent">
            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-5">Student</TableHead>
            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</TableHead>
            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Emotion</TableHead>
            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pose</TableHead>
            <TableHead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="py-20 text-center">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                    <UserCheck size={20} className="text-slate-400/50" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-slate-300">No records found</p>
                    <p className="text-xs text-slate-500">Attendance data will appear here after a scan</p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            records.map((record, index) => (
              <TableRow key={index} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors group">
                <TableCell className="py-4 pl-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-blue-400">
                        {record.full_name.charAt(0)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">
                        {record.full_name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {record.student_id}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    record.status === 'present' 
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                      : record.status === 'absent'
                      ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      record.status === 'present' ? 'bg-emerald-500' : record.status === 'absent' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    {record.status.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell className="py-4">
                  {record.emotion ? (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Smile size={14} className="text-slate-400" />
                      <span className="text-xs capitalize">{record.emotion}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  {record.pose ? (
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <PersonStanding size={14} className="text-slate-400" />
                      <span className="text-xs capitalize">{record.pose}</span>
                    </div>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </TableCell>
                <TableCell className="py-4">
                  <span className="text-xs text-slate-500 font-mono">
                    {new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

