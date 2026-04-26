import { format, parseISO } from 'date-fns';
import { MakuhariEvent } from '@/types';
import { getVenueLabel, getTypeLabel, getAttendanceLabel } from '@/lib/events';

const attendanceBadgeColor: Record<MakuhariEvent['expectedAttendance'], string> = {
  small: 'bg-green-900 text-green-300',
  medium: 'bg-yellow-900 text-yellow-300',
  large: 'bg-orange-900 text-orange-300',
  massive: 'bg-red-900 text-red-300',
};

const typeBadgeColor: Record<MakuhariEvent['type'], string> = {
  concert: 'bg-purple-900 text-purple-300',
  exhibition: 'bg-blue-900 text-blue-300',
  sports: 'bg-cyan-900 text-cyan-300',
  sale: 'bg-pink-900 text-pink-300',
  festival: 'bg-amber-900 text-amber-300',
  other: 'bg-gray-800 text-gray-400',
};

export default function EventList({ events }: { events: MakuhariEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-4">
        <h2 className="font-semibold text-gray-200 mb-2">開催イベント</h2>
        <p className="text-sm text-gray-500">この日は登録されたイベントはありません</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4">
      <h2 className="font-semibold text-gray-200 mb-3">
        開催イベント
        <span className="ml-2 text-xs text-gray-500 font-normal">{events.length}件</span>
      </h2>
      <div className="space-y-3">
        {events.map(event => (
          <div key={event.id} className="border border-gray-800 rounded-lg p-3">
            <div className="font-medium text-gray-100 text-sm mb-1">{event.name}</div>
            <div className="text-xs text-gray-500 mb-2">
              {event.startDate === event.endDate
                ? format(parseISO(event.startDate), 'M/d')
                : `${format(parseISO(event.startDate), 'M/d')} 〜 ${format(parseISO(event.endDate), 'M/d')}`}
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                {getVenueLabel(event.venue)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${typeBadgeColor[event.type]}`}>
                {getTypeLabel(event.type)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${attendanceBadgeColor[event.expectedAttendance]}`}>
                {getAttendanceLabel(event.expectedAttendance)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
