import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Theme } from '@/constants/theme';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withDelay,
  Easing
} from 'react-native-reanimated';

const CHART_HEIGHT = 200;
const CHART_PADDING = 20;
const LINE_WIDTH = 2;

type DataPoint = {
  label: string;
  data: number[];
  color: string;
};

type ChartData = {
  labels: string[];
  datasets: DataPoint[];
};

type LineChartProps = {
  data: ChartData;
};

export const LineChart: React.FC<LineChartProps> = ({ data }) => {
  const progress = useSharedValue(0);
  
  React.useEffect(() => {
    progress.value = withTiming(1, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, []);

  const getPathD = (dataset: number[], index: number) => {
    const width = Dimensions.get('window').width - (CHART_PADDING * 2);
    const segmentWidth = width / (dataset.length - 1);
    
    return dataset.map((point, i) => {
      const x = i * segmentWidth;
      const y = CHART_HEIGHT - (point / 100 * CHART_HEIGHT);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <View style={styles.container}>
      <View style={styles.chart}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          {[100, 75, 50, 25, 0].map((value) => (
            <Text key={value} style={styles.axisLabel}>
              {value}
            </Text>
          ))}
        </View>

        {/* Chart area */}
        <View style={styles.chartArea}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => (
            <View
              key={value}
              style={[
                styles.gridLine,
                {
                  top: (value / 100) * CHART_HEIGHT,
                },
              ]}
            />
          ))}

          {/* Lines */}
          <Animated.View style={[styles.linesContainer, animatedStyle]}>
            {data.datasets.map((dataset, index) => (
              <View key={index} style={styles.lineContainer}>
                <svg
                  height={CHART_HEIGHT}
                  width="100%"
                  style={styles.svg}
                >
                  <path
                    d={getPathD(dataset.data, index)}
                    stroke={dataset.color}
                    strokeWidth={LINE_WIDTH}
                    fill="none"
                  />
                </svg>
              </View>
            ))}
          </Animated.View>
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {data.labels.map((label, index) => (
          <Text key={index} style={styles.axisLabel}>
            {label}
          </Text>
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {data.datasets.map((dataset, index) => (
          <View key={index} style={styles.legendItem}>
            <View
              style={[styles.legendColor, { backgroundColor: dataset.color }]}
            />
            <Text style={styles.legendLabel}>{dataset.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: CHART_PADDING,
  },
  chart: {
    flexDirection: 'row',
    height: CHART_HEIGHT,
  },
  yAxis: {
    width: 30,
    height: CHART_HEIGHT,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 5,
  },
  chartArea: {
    flex: 1,
    height: CHART_HEIGHT,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  linesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  lineContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  svg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 5,
    marginLeft: 30,
  },
  axisLabel: {
    fontSize: 12,
    color: Theme.colors.textTertiary,
    fontFamily: 'Inter-Regular',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: Theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Theme.spacing.xs,
  },
  legendLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontFamily: 'Inter-Regular',
  },
});