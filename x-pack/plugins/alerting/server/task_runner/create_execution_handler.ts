/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { pluck } from 'lodash';
import { AlertAction, State, Context, AlertType } from '../types';
import { Logger } from '../../../../../src/core/server';
import { transformActionParams } from './transform_action_params';
import { PluginStartContract as ActionsPluginStartContract } from '../../../../plugins/actions/server';
import { IEventLogger, IEvent } from '../../../event_log/server';
import { EVENT_LOG_ACTIONS } from '../plugin';

interface CreateExecutionHandlerOptions {
  alertId: string;
  alertName: string;
  tags?: string[];
  actionsPlugin: ActionsPluginStartContract;
  actions: AlertAction[];
  spaceId: string;
  apiKey: string | null;
  alertType: AlertType;
  logger: Logger;
  eventLogger: IEventLogger;
}

interface ExecutionHandlerOptions {
  actionGroup: string;
  alertInstanceId: string;
  context: Context;
  state: State;
}

export function createExecutionHandler({
  logger,
  alertId,
  alertName,
  tags,
  actionsPlugin,
  actions: alertActions,
  spaceId,
  apiKey,
  alertType,
  eventLogger,
}: CreateExecutionHandlerOptions) {
  const alertTypeActionGroups = new Set(pluck(alertType.actionGroups, 'id'));
  return async ({ actionGroup, context, state, alertInstanceId }: ExecutionHandlerOptions) => {
    if (!alertTypeActionGroups.has(actionGroup)) {
      logger.error(`Invalid action group "${actionGroup}" for alert "${alertType.id}".`);
      return;
    }
    const actions = alertActions
      .filter(({ group }) => group === actionGroup)
      .map(action => {
        return {
          ...action,
          params: transformActionParams({
            alertId,
            alertName,
            spaceId,
            tags,
            alertInstanceId,
            context,
            actionParams: action.params,
            state,
          }),
        };
      });

    const alertLabel = `${alertType.id}:${alertId}: '${alertName}'`;

    for (const action of actions) {
      if (!actionsPlugin.isActionExecutable(action.id, action.actionTypeId)) {
        logger.warn(
          `Alert "${alertId}" skipped scheduling action "${action.id}" because it is disabled`
        );
        continue;
      }

      // TODO would be nice  to add the action name here, but it's not available
      const actionLabel = `${action.actionTypeId}:${action.id}`;
      await actionsPlugin.execute({
        id: action.id,
        params: action.params,
        spaceId,
        apiKey,
      });

      const namespace = spaceId === 'default' ? {} : { namespace: spaceId };

      const event: IEvent = {
        event: { action: EVENT_LOG_ACTIONS.executeAction },
        kibana: {
          alerting: {
            instance_id: alertInstanceId,
          },
          saved_objects: [
            { type: 'alert', id: alertId, ...namespace },
            { type: 'action', id: action.id, ...namespace },
          ],
        },
      };

      event.message = `alert: ${alertLabel} instanceId: '${alertInstanceId}' scheduled actionGroup: '${actionGroup}' action: ${actionLabel}`;
      eventLogger.logEvent(event);
    }
  };
}
