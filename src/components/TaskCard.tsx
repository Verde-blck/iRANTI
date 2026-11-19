import React, { memo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { usePulse } from '../hooks/usePulse';
import { strings } from '../i18n/strings';
import { glow } from '../theme/glow';
import type { Priority, Task } from '../types/task';
import { subtaskProgress } from '../utils/taskFilters';
import { isApproaching, isOverdue } from '../utils/taskOrder';
import { formatWhen } from '../utils/time';
import { DeliveryTag } from './DeliveryTag';

interface TaskCardProps {
  task: Task;
  now: number;
  listName?: string | null;
  onOpen: (task: Task) => void;
  onToggle: (task: Task) => void;
}

const MARKER: Record<Priority, string> = {
  low: 'bg-fog',
  normal: 'bg-radon-40',
  high: 'bg-[#00FF66]',
  critical: 'bg-flare',
};

function describe(task: Task, now: number): string {
  if (task.completed) {
    return task.completedAt
      ? `${strings.task.done} ${formatWhen(task.completedAt, now)}`
      : strings.task.done;
  }
  if (task.remindAt === null) {
    return strings.task.noReminder;
  }
  return isOverdue(task, now)
    ? `${strings.task.missed} ${formatWhen(task.remindAt, now)}`
    : formatWhen(task.remindAt, now);
}

function TaskCardView({ task, now, listName = null, onOpen, onToggle }: TaskCardProps) {
  const approaching = isApproaching(task, now);
  const overdue = isOverdue(task, now);
  const { haloStyle, coreStyle } = usePulse(approaching);
  const meta = describe(task, now);
  const progress = subtaskProgress(task.subtasks);
  const steps = progress.total > 0 ? strings.task.steps(progress.done, progress.total) : null;

  return (
    <View className="mb-3">
      <Animated.View pointerEvents="none" style={[glow.card, haloStyle]} />
      <Animated.View style={coreStyle}>
        <View
          className={`flex-row overflow-hidden rounded-[10px] border bg-[#000000] ${
            approaching ? 'border-[#00FF66]' : 'border-radon-25'
          }`}>
          <View className={`w-[3px] ${MARKER[task.priority]}`} />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: task.completed }}
            accessibilityLabel={
              task.completed ? strings.task.markIncomplete : strings.task.markComplete
            }
            hitSlop={6}
            onPress={() => onToggle(task)}
            className="items-center justify-center pl-4 pr-3">
            <View
              className={`h-[22px] w-[22px] items-center justify-center rounded-full border ${
                task.completed ? 'border-[#00FF66] bg-[#00FF66]' : 'border-radon-60'
              }`}>
              {task.completed ? (
                <Text className="text-[13px] font-bold text-[#000000]">✓</Text>
              ) : null}
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={[task.title, strings.priority[task.priority], meta, steps, listName]
              .filter(Boolean)
              .join(', ')}
            onPress={() => onOpen(task)}
            className="flex-1 py-3.5 pr-4 active:opacity-70">
            <Text
              numberOfLines={2}
              className={`text-[16px] font-semibold leading-[21px] ${
                task.completed ? 'text-fog line-through' : 'text-ink'
              }`}>
              {task.title}
            </Text>
            {task.notes ? (
              <Text numberOfLines={1} className="mt-0.5 text-[14px] text-mist">
                {task.notes}
              </Text>
            ) : null}
            <View className="mt-2 flex-row flex-wrap items-center gap-2">
              <Text className={`text-[13px] ${overdue ? 'text-flare' : 'text-mist'}`}>{meta}</Text>
              {!task.completed && task.remindAt !== null && !overdue ? (
                <DeliveryTag mode={task.delivery} />
              ) : null}
              {steps ? (
                <Text
                  className={`text-[13px] ${
                    progress.done === progress.total ? 'text-[#00FF66]' : 'text-mist'
                  }`}>
                  {steps}
                </Text>
              ) : null}
              {listName ? (
                <View className="rounded-md border border-radon-25 px-2 py-0.5">
                  <Text className="text-[11px] font-medium text-mist">{listName}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

export const TaskCard = memo(TaskCardView);
