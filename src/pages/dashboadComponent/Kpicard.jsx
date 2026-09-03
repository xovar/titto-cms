import PropTypes from 'prop-types';

// আইকনের রং অনুযায়ী background/text classes — Tailwind-এ dynamic class string
// বানালে purge হয়ে যায়, তাই fixed lookup map ব্যবহার করা হচ্ছে।
const COLOR_MAP = {
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-500/10',
    icon: 'text-blue-600 dark:text-blue-400',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-500/10',
    icon: 'text-green-600 dark:text-green-400',
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-500/10',
    icon: 'text-purple-600 dark:text-purple-400',
  },
};

export default function KpiCard({ icon: Icon, iconColor = 'blue', label, value, subtext }) {
  const colors = COLOR_MAP[iconColor] || COLOR_MAP.blue;

  return (
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl p-4 flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark truncate">
          {label}
        </p>
        <p className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mt-1 truncate">
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-1 truncate">
            {subtext}
          </p>
        )}
      </div>

      {Icon && (
        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
      )}
    </div>
  );
}

KpiCard.propTypes = {
  icon: PropTypes.elementType,
  iconColor: PropTypes.oneOf(['blue', 'green', 'amber', 'purple']),
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtext: PropTypes.string,
};