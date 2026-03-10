import { ScrollArea } from "@/components/ui/scroll-area"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface AttendanceListProps {
  attendance: string[]
}

export default function AttendanceList({ attendance }: AttendanceListProps) {
  return (
    <ScrollArea className="h-[400px] w-full rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
          <TableHead>Person</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendance.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center text-gray-500">
                No attendance recorded yet.
              </TableCell>
            </TableRow>
          ) : (
            attendance.map((entry, index) => (
              <TableRow key={index}>
                <TableCell>Hizikyas</TableCell>
                <TableCell>{entry.split(" at ")[1]}</TableCell>
                <TableCell>Present</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  )
}

