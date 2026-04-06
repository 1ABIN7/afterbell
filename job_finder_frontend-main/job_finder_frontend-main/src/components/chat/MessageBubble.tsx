import { Calendar, Clock, Video, Trash2 } from 'lucide-react';
import { formatMessageTime } from '../../lib/formatters';

interface MessageBubbleProps {
  msg: any;
  isMe: boolean;
  isDeleting: boolean;
  onDelete?: (id: string) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  /** Whether to show a 'Check your Applications' CTA text at the bottom. Default false. */
  showInterviewCta?: boolean;
}

export function MessageBubble({ 
  msg, 
  isMe, 
  isDeleting, 
  onDelete, 
  hoveredId, 
  setHoveredId,
  showInterviewCta = false 
}: MessageBubbleProps) {
  
  const isHovered = hoveredId === msg.id;

  return (
    <div
      className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setHoveredId(msg.id)}
      onMouseLeave={() => setHoveredId(null)}
    >
      {/* Delete button — only for own messages, shows on hover */}
      {isMe && onDelete && (
        <button
          onClick={() => onDelete(msg.id)}
          disabled={isDeleting}
          className={`p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all ${
            isHovered ? 'opacity-100' : 'opacity-0'
          } ${isDeleting ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="Delete message"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
      
      <div
        className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl ${
          isMe
            ? 'bg-[#F5C518] text-[#1A1A1A] rounded-br-none'
            : 'bg-white dark:bg-[#2D2D2D] text-[#1A1A1A] dark:text-white rounded-bl-none shadow-sm dark:shadow-none border border-gray-100 dark:border-gray-800'
        }`}
      >
        {msg.content?.startsWith('[INTERVIEW_PROPOSAL]') ? (
          (() => {
            try {
              const data = JSON.parse(msg.content.replace('[INTERVIEW_PROPOSAL]', ''));
              const dateObj = new Date(data.interview_date + 'T00:00:00');
              const formatted = dateObj.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });
              
              return (
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-800 min-w-[240px]">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span className="font-bold text-blue-800 dark:text-blue-300 text-sm">
                      Interview {showInterviewCta ? 'Proposal' : 'Scheduled'}
                    </span>
                  </div>
                  <p className="font-semibold text-[#1A1A1A] dark:text-white mb-2">{data.job_title}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    {formatted}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 mb-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    {data.interview_time}
                  </div>
                  {data.interview_link && (() => {
                    const rawLink = data.interview_link.trim();
                    const safeLink = rawLink.match(/^https?:\/\//i) ? rawLink : `https://${rawLink}`;
                    return (
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 mb-1">
                        <Video className="w-4 h-4 flex-shrink-0" />
                        <a
                          href={safeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="underline truncate hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          {rawLink}
                        </a>
                      </div>
                    );
                  })()}
                  {data.interview_notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">"{data.interview_notes}"</p>
                  )}
                  {showInterviewCta && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-3 font-medium">
                      Check your Applications to accept →
                    </p>
                  )}
                </div>
              );
            } catch {
              return <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>;
            }
          })()
        ) : (
          <p className="leading-relaxed break-words whitespace-pre-wrap">{msg.content}</p>
        )}
        
        <p className={`text-xs mt-1 ${isMe ? 'text-[#1A1A1A]/50 text-right' : 'text-gray-400 dark:text-gray-500'}`}>
          {formatMessageTime(msg.created_at)}
        </p>
      </div>
    </div>
  );
}
