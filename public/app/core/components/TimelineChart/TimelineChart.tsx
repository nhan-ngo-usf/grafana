import React from 'react';

import { DataFrame, FALLBACK_COLOR, FieldType, TimeRange } from '@grafana/data';
import { VisibilityMode, TimelineValueAlignment, TooltipDisplayMode } from '@grafana/schema';
import { PanelContext, PanelContextRoot, UPlotConfigBuilder, VizLayout, VizLegend, VizLegendItem } from '@grafana/ui';

import { GraphNG, GraphNGProps } from '../GraphNG/GraphNG';

import { preparePlotConfigBuilder, TimelineMode } from './utils';

/**
 * @alpha
 */
export interface TimelineProps extends Omit<GraphNGProps, 'prepConfig' | 'propsToDiff' | 'renderLegend'> {
  mode: TimelineMode;
  rowHeight?: number;
  showValue: VisibilityMode;
  alignValue?: TimelineValueAlignment;
  colWidth?: number;
  legendItems?: VizLegendItem[];
}

const propsToDiff = ['rowHeight', 'colWidth', 'showValue', 'mergeValues', 'alignValue', 'tooltip'];

export class TimelineChart extends React.Component<TimelineProps> {
  declare context: React.ContextType<typeof PanelContextRoot>;
  static contextType = PanelContextRoot;
  panelContext: PanelContext | undefined;

  getValueColor = (frameIdx: number, fieldIdx: number, value: unknown) => {
    const field = this.props.frames[frameIdx].fields[fieldIdx];

    if (field.display) {
      const disp = field.display(value); // will apply color modes
      if (disp.color) {
        return disp.color;
      }
    }

    return FALLBACK_COLOR;
  };

  prepConfig = (alignedFrame: DataFrame, allFrames: DataFrame[], getTimeRange: () => TimeRange) => {
    this.panelContext = this.context;
    const { eventBus, sync } = this.panelContext;

    return preparePlotConfigBuilder({
      frame: alignedFrame,
      getTimeRange,
      eventBus,
      sync,
      allFrames: this.props.frames,
      ...this.props,

      // Ensure timezones is passed as an array
      timeZones: Array.isArray(this.props.timeZone) ? this.props.timeZone : [this.props.timeZone],

      // When there is only one row, use the full space
      rowHeight: alignedFrame.fields.length > 2 ? this.props.rowHeight : 1,
      getValueColor: this.getValueColor,
      // @ts-ignore
      hoverMulti: this.props.tooltip.mode === TooltipDisplayMode.Multi,
    });
  };

  renderLegend = (config: UPlotConfigBuilder) => {
    const { legend, legendItems } = this.props;

    if (!config || !legendItems || !legend || legend.showLegend === false) {
      return null;
    }

    return (
      <VizLayout.Legend placement={legend.placement}>
        <VizLegend placement={legend.placement} items={legendItems} displayMode={legend.displayMode} readonly />
      </VizLayout.Legend>
    );
  };

  render() {
    return (
      <GraphNG
        {...this.props}
        fields={{
          x: (f) => f.type === FieldType.time,
          y: (f) =>
            f.type === FieldType.number ||
            f.type === FieldType.boolean ||
            f.type === FieldType.string ||
            f.type === FieldType.enum,
        }}
        prepConfig={this.prepConfig}
        propsToDiff={propsToDiff}
        renderLegend={this.renderLegend}
      />
    );
  }
}
