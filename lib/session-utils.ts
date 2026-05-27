export interface DaySchedule {
  day: string;
  start_time: string;
  end_time: string;
}

export interface ScheduledSession {
  id: string;
  date: string; // ISO string
  day: string;
  startTime: string;
  endTime: string;
  label: string;
}

export function generateScheduledSessions(startDate: string, endDate: string, schedule: DaySchedule[]): ScheduledSession[] {
  if (!startDate || !endDate || !schedule || !Array.isArray(schedule)) return [];

  const start = new Date(startDate);
  const end = new Date(endDate);
  const sessions: ScheduledSession[] = [];
  
  const dayMap: { [key: string]: number } = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };

  const scheduledDays = schedule.map(s => ({
    dayNum: dayMap[s.day],
    startTime: s.start_time,
    endTime: s.end_time,
    dayName: s.day
  }));

  const current = new Date(start);
  // Reset time to midnight to avoid issues with time comparisons
  current.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  while (current <= end) {
    const dayNum = current.getDay();
    const matches = scheduledDays.filter(d => d.dayNum === dayNum);
    
    for (const daySchedule of matches) {
      const sessionDate = new Date(current);
      // We don't have a unique ID for scheduled sessions until they are saved, 
      // so we create one based on date and time for frontend tracking.
      const id = `sched-${sessionDate.getTime()}-${daySchedule.startTime.replace(/[^a-zA-Z0-9]/g, '')}`;
      sessions.push({
        id,
        date: sessionDate.toISOString(),
        day: daySchedule.dayName,
        startTime: daySchedule.startTime,
        endTime: daySchedule.endTime,
        label: `${sessionDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – ${daySchedule.dayName} (${daySchedule.startTime} – ${daySchedule.endTime})`
      });
    }
    current.setDate(current.getDate() + 1);
  }
  
  return sessions;
}
