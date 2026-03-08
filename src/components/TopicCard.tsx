import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Clock,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import type { Topic, Constraint, TopicCategory } from "@/types";
import { CATEGORY_LABELS } from "@/types";

type TopicCardProps = {
  topic: Topic;
  constraint: Constraint;
};

const CONDITION_ITEMS = [
  { key: "teamSize", icon: Users, label: "チーム" },
  { key: "company", icon: Building2, label: "組織" },
  { key: "deadline", icon: Clock, label: "納期" },
  { key: "budget", icon: Wallet, label: "予算" },
] as const;

const categoryVariantMap: Record<TopicCategory, "web" | "api" | "infra" | "data" | "mobile"> = {
  web: "web",
  api: "api",
  infra: "infra",
  data: "data",
  mobile: "mobile",
};

export function TopicCard({ topic, constraint }: TopicCardProps) {
  return (
    <Card className="animate-slide-up">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant={categoryVariantMap[topic.category]}>
            {CATEGORY_LABELS[topic.category]}
          </Badge>
        </div>
        <CardTitle className="text-2xl">{topic.title}</CardTitle>
        <CardDescription className="text-base leading-relaxed">
          {topic.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <h3 className="text-sm font-semibold text-text-sub">現場条件</h3>
        <div className="grid grid-cols-2 gap-3">
          {CONDITION_ITEMS.map(({ key, icon: Icon, label }) => (
            <div
              key={key}
              className="flex items-start gap-2 rounded-lg border border-border bg-background p-3"
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs text-text-sub">{label}</p>
                <p className="text-sm font-medium">{constraint[key]}</p>
              </div>
            </div>
          ))}
        </div>

        {constraint.extra && (
          <div className="flex items-start gap-2 rounded-lg border border-secondary/30 bg-secondary-light p-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-secondary" />
            <div>
              <p className="text-xs text-text-sub">追加制約</p>
              <p className="text-sm font-medium">{constraint.extra}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
