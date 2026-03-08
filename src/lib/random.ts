import topicsData from "@/data/topics.json";
import constraintsData from "@/data/constraints.json";
import type { Topic, Constraint, TopicCategory } from "@/types";

const topics: Topic[] = topicsData as Topic[];
const constraints: Constraint[] = constraintsData as Constraint[];

function getRandomIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

export function getRandomTopic(category?: TopicCategory): Topic {
  const pool = category
    ? topics.filter((t) => t.category === category)
    : topics;
  return pool[getRandomIndex(pool.length)];
}

export function getRandomConstraint(): Constraint {
  return constraints[getRandomIndex(constraints.length)];
}

export function getRandomTestCondition(category?: TopicCategory): {
  topic: Topic;
  constraint: Constraint;
} {
  return {
    topic: getRandomTopic(category),
    constraint: getRandomConstraint(),
  };
}
