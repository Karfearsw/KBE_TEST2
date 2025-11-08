import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { cn } from '@/lib/utils';
import './fullcalendar.css';

interface FullCalendarProps {
  className?: string;
  events?: any[];
  initialView?: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  selectable?: boolean;
  editable?: boolean;
  headerToolbar?: {
    left: string;
    center: string;
    right: string;
  };
  dateClick?: (arg: any) => void;
  eventClick?: (arg: any) => void;
  select?: (arg: any) => void;
  eventContent?: (arg: any) => React.ReactNode;
  height?: string | number;
}

/**
 * A modern calendar component using FullCalendar that supports proper 2025 dates and event syncing
 */
export function ModernCalendar({
  className,
  events = [],
  initialView = 'dayGridMonth',
  selectable = false,
  editable = false,
  dateClick,
  eventClick,
  select,
  eventContent,
  headerToolbar = {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  height = 'auto',
}: FullCalendarProps) {
  return (
    <div className={cn('rounded-md border', className)}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={initialView}
        events={events}
        selectable={selectable}
        editable={editable}
        headerToolbar={headerToolbar}
        height={height}
        dateClick={dateClick}
        eventClick={eventClick}
        select={select}
        eventContent={eventContent}
        // Ensure calendar works for years far into the future (2025+)
        nowIndicator={true}
        timeZone="local"
        // Support for different screen sizes
        aspectRatio={1.35}
        views={{
          dayGridMonth: {
            titleFormat: { year: 'numeric', month: 'long' },
          },
          timeGridWeek: {
            titleFormat: { year: 'numeric', month: 'short', day: 'numeric' },
          },
          timeGridDay: {
            titleFormat: { year: 'numeric', month: 'long', day: 'numeric' },
          },
        }}
      />
    </div>
  );
}