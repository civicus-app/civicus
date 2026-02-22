import { Link } from 'react-router-dom';
import { Calendar, Users, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDate, truncateText } from '../../lib/utils';
import type { Policy } from '../../types/policy.types';

interface PolicyCardProps {
  policy: Policy;
  engagementCount?: number;
}

export default function PolicyCard({ policy, engagementCount = 0 }: PolicyCardProps) {
  const statusLabel: Record<string, string> = {
    active: 'Active',
    under_review: 'Under Review',
    closed: 'Closed',
    draft: 'Draft',
  };

  return (
    <Link to={`/policies/${policy.id}`}>
      <Card className="h-full bg-white border border-[#d4dde9] hover:shadow-md hover:border-[#9eb6d4] transition-all cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-[#274769] leading-snug line-clamp-2">{policy.title}</h3>
            <Badge variant={policy.status as 'active' | 'under_review' | 'closed' | 'draft'} className="flex-shrink-0">
              {statusLabel[policy.status]}
            </Badge>
          </div>
          {policy.category && (
            <span
              className="inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold text-white w-fit"
              style={{ backgroundColor: policy.category.color || '#6B7280' }}
            >
              {policy.category.name}
            </span>
          )}
        </CardHeader>
        <CardContent className="pb-3">
          <p className="text-sm text-[#4f6684] line-clamp-3">
            {truncateText(policy.description, 150)}
          </p>
        </CardContent>
        <CardFooter className="pt-0 flex items-center justify-between text-xs text-[#5b7391]">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(policy.start_date)}</span>
            </div>
            {policy.end_date && (
              <div className="flex items-center space-x-1 text-orange-600">
                <span>Closes: {formatDate(policy.end_date)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <Users className="h-3.5 w-3.5" />
            <span>{engagementCount}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
