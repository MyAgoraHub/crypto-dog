<script setup>
import { computed } from 'vue';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: true,
  },
});

const signalColor = computed(() => {
  switch (props.data.signal) {
    case 'buy':
      return 'text-green-400';
    case 'sell':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
});

const signalBgColor = computed(() => {
  switch (props.data.signal) {
    case 'buy':
      return 'bg-green-900 bg-opacity-20 border-green-500';
    case 'sell':
      return 'bg-red-900 bg-opacity-20 border-red-500';
    default:
      return 'bg-gray-700 bg-opacity-20 border-gray-600';
  }
});

const formatValue = (value) => {
  if (typeof value === 'number') {
    return value.toFixed(2);
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2);
  }
  return value;
};

const displayValue = computed(() => {
  const value = props.data.currentValue;
  
  if (props.name === 'SuperTrend' && value.trend) {
    return `${value.trend.toUpperCase()} @ $${value.value.toFixed(2)}`;
  }
  
  if (props.name === 'MACD' && value.MACD !== undefined) {
    return `MACD: ${value.MACD.toFixed(2)}`;
  }
  
  if (props.name === 'Bollinger Bands' && value.upper) {
    return `Mid: $${value.middle.toFixed(2)}`;
  }
  
  if (props.name === 'Multi Divergence' && value.c) {
    return `Price: $${value.c.toFixed(2)}`;
  }
  
  return formatValue(value);
});

// Compute divergences for Multi Divergence indicator
const allDivergences = computed(() => {
  if (props.name !== 'Multi Divergence') return null;
  
  const value = props.data.currentValue;
  console.log('Multi Divergence currentValue:', value);
  
  if (!value || !value.divergence) {
    console.log('No divergence data found');
    return null;
  }
  
  console.log('All divergences:', value.divergence);
  
  // Return all divergences including pending ones
  return value.divergence;
});

// Line chart computation
const chartData = computed(() => {
  if (!props.data.history || props.data.history.length === 0) return null;
  
  let data = props.data.history;
  
  // Detect if we have objects with multiple numeric fields
  const firstItem = data[0];
  let lines = [];
  
  if (typeof firstItem === 'object' && firstItem !== null) {
    // Extract all numeric fields from the object
    const numericFields = Object.keys(firstItem).filter(key => {
      const value = firstItem[key];
      return typeof value === 'number' && !isNaN(value) && key !== 'timestamp';
    });
    
    // Special handling for Bollinger Bands - add price if available
    if (props.name === 'Bollinger Bands' && numericFields.length > 0) {
      // Use last 30 points for Bollinger Bands
      data = data.slice(-30);
      // Check if we have price data (close price)
      const hasPrice = data.some(item => item.close !== undefined || item.price !== undefined);
      
      if (hasPrice) {
        // Include price line with bands
        lines = [
          {
            name: 'UPPER',
            values: data.map(item => item.upper || 0),
            color: '#ef4444', // red
            dashed: true
          },
          {
            name: 'MIDDLE',
            values: data.map(item => item.middle || 0),
            color: '#3b82f6', // blue
            dashed: false
          },
          {
            name: 'LOWER',
            values: data.map(item => item.lower || 0),
            color: '#10b981', // green
            dashed: true
          },
          {
            name: 'PRICE',
            values: data.map(item => item.close || item.price || 0),
            color: '#f59e0b', // amber/orange
            dashed: false
          }
        ];
      } else {
        // Show bands as percentage deviation from middle
        lines = numericFields.map((field, fieldIndex) => {
          const values = data.map(item => item[field] || 0);
          return {
            name: field.toUpperCase(),
            values,
            color: getLineColor(fieldIndex, numericFields.length),
            dashed: field !== 'middle'
          };
        });
      }
    }
    // Special handling for EMA/SMA multi-period trend indicators
    else if ((props.name.includes('EMA Trend') || props.name.includes('SMA Trend')) && numericFields.length > 0) {
      const prefix = props.name.includes('EMA') ? 'ema' : 'sma';
      
      // Filter out data points where any of the values are undefined/null
      const validData = data.filter(item => 
        item[prefix + '20'] != null && 
        item[prefix + '50'] != null && 
        item[prefix + '200'] != null
      );
      
      // Use the last 30 valid points
      const chartPoints = validData.slice(-30);
      
      lines = [
        {
          name: '20',
          values: chartPoints.map(item => item[prefix + '20']),
          color: '#10b981', // green
          dashed: false
        },
        {
          name: '50',
          values: chartPoints.map(item => item[prefix + '50']),
          color: '#3b82f6', // blue
          dashed: false
        },
        {
          name: '200',
          values: chartPoints.map(item => item[prefix + '200']),
          color: '#eab308', // yellow
          dashed: false
        }
      ];
    }
    // If we have multiple numeric fields, create multiple lines
    else if (numericFields.length > 0) {
      // Use last 30 points
      const chartPoints = data.slice(-30);
      lines = numericFields.map((field, fieldIndex) => {
        const values = chartPoints.map(item => item[field] || 0);
        return {
          name: field.toUpperCase(),
          values,
          color: getLineColor(fieldIndex, numericFields.length),
          dashed: false
        };
      });
    }
  }
  
  // Fallback to single line if data is simple numbers or we couldn't extract fields
  if (lines.length === 0) {
    // Use last 30 points
    const chartPoints = data.slice(-30);
    const values = chartPoints.map(item => {
      if (typeof item === 'number') return item;
      if (item.rsi !== undefined) return item.rsi;
      if (item.value !== undefined) return item.value;
      if (item.MACD !== undefined) return item.MACD;
      if (item.middle !== undefined) return item.middle;
      return 0;
    });
    
    lines = [{
      name: props.name,
      values,
      color: props.data.signal === 'buy' ? '#10b981' : props.data.signal === 'sell' ? '#ef4444' : '#3b82f6',
      dashed: false
    }];
  }
  
  // Calculate global min/max across all lines
  const allValues = lines.flatMap(line => line.values);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;
  
  // Create SVG paths for each line
  const width = 300;
  const height = 60;
  const padding = 5;
  
  const linesWithPaths = lines.map(line => {
    const points = line.values.map((value, index) => {
      const x = (index / (line.values.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - ((value - min) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
    
    return {
      ...line,
      points,
      current: line.values[line.values.length - 1].toFixed(2)
    };
  });
  
  return {
    width,
    height,
    lines: linesWithPaths,
    min: min.toFixed(2),
    max: max.toFixed(2)
  };
});

// Helper function to get distinct colors for multiple lines
const getLineColor = (index, total) => {
  const colors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#ef4444', // red
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
  ];
  return colors[index % colors.length];
};
</script>

<template>
  <div class="card">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white">{{ name }}</h3>
      <div 
        class="px-3 py-1 rounded-md text-sm font-medium uppercase border"
        :class="signalBgColor + ' ' + signalColor"
      >
        {{ data.signal }}
      </div>
    </div>

    <!-- Current Value -->
    <div class="mb-4">
      <div class="text-gray-400 text-sm mb-1">Current Value</div>
      <div class="text-2xl font-bold text-white">
        {{ displayValue }}
      </div>
    </div>

    <!-- Detailed Info for specific indicators -->
    <div v-if="name === 'MACD' && data.currentValue.signal" class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-400">Signal Line:</span>
        <span class="text-white">{{ data.currentValue.signal.toFixed(2) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-400">Histogram:</span>
        <span class="text-white">{{ data.currentValue.histogram.toFixed(2) }}</span>
      </div>
    </div>

    <div v-else-if="name === 'Bollinger Bands' && data.currentValue.upper" class="space-y-2 text-sm">
      <div class="flex justify-between">
        <span class="text-gray-400">Upper Band:</span>
        <span class="text-white">${{ data.currentValue.upper.toFixed(2) }}</span>
      </div>
      <div class="flex justify-between">
        <span class="text-gray-400">Lower Band:</span>
        <span class="text-white">${{ data.currentValue.lower.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Divergence Display for Multi Divergence Indicator -->
    <div v-else-if="name === 'Multi Divergence' && allDivergences && allDivergences.length > 0" class="space-y-2 text-sm mb-4">
      <div class="text-gray-400 text-xs font-semibold mb-2 uppercase">Divergence Signals:</div>
      <div v-for="(div, idx) in allDivergences" :key="idx" 
           class="flex items-start justify-between p-2 rounded"
           :class="{
             'bg-red-900 bg-opacity-20 border border-red-500': div.type.includes('Bearish') && !div.type.includes('Pending'),
             'bg-green-900 bg-opacity-20 border border-green-500': div.type.includes('Bullish') && !div.type.includes('Pending'),
             'bg-orange-900 bg-opacity-20 border border-orange-500': div.type.includes('Pending')
           }">
        <div class="flex items-center gap-2 flex-1">
          <!-- Status Indicator Dot -->
          <div class="flex-shrink-0">
            <div class="w-2 h-2 rounded-full"
                 :class="{
                   'bg-red-500': div.type.includes('Bearish') && !div.type.includes('Pending'),
                   'bg-green-500': div.type.includes('Bullish') && !div.type.includes('Pending'),
                   'bg-orange-500': div.type.includes('Pending')
                 }">
            </div>
          </div>
          <!-- Divergence Info -->
          <div class="flex-1">
            <div class="font-semibold text-xs"
                 :class="{
                   'text-red-400': div.type.includes('Bearish') && !div.type.includes('Pending'),
                   'text-green-400': div.type.includes('Bullish') && !div.type.includes('Pending'),
                   'text-orange-400': div.type.includes('Pending')
                 }">
              {{ div.indicator }}
            </div>
            <div class="text-gray-300 text-xs">{{ div.type }}</div>
          </div>
        </div>
        <div class="text-right text-xs">
          <div class="text-gray-400">Price</div>
          <div class="text-white font-medium">${{ div.close.toFixed(2) }}</div>
        </div>
      </div>
    </div>

    <!-- Line Chart -->
    <div v-if="chartData" class="mt-4 pt-4 border-t border-gray-700">
      <div class="flex justify-between items-center mb-2">
        <div class="text-gray-400 text-xs">Historical Trend (Last 30)</div>
        <div class="text-gray-500 text-xs">
          Min: {{ chartData.min }} | Max: {{ chartData.max }}
        </div>
      </div>
      
      <!-- Legend for multiple lines -->
      <div v-if="chartData.lines.length > 1" class="flex flex-wrap gap-2 mb-2">
        <div v-for="line in chartData.lines" :key="line.name" class="flex items-center text-xs">
          <div class="w-3 h-0.5 mr-1" :style="{ backgroundColor: line.color }"></div>
          <span class="text-gray-400">{{ line.name }}: </span>
          <span class="text-white ml-1">{{ line.current }}</span>
        </div>
      </div>
      
      <svg :width="chartData.width" :height="chartData.height" class="w-full" style="background: rgba(31, 41, 55, 0.3); border-radius: 4px;">
        <!-- Grid lines -->
        <line x1="5" :y1="chartData.height - 5" :x2="chartData.width - 5" :y2="chartData.height - 5" stroke="#374151" stroke-width="1" />
        <line x1="5" y1="5" :x2="chartData.width - 5" y2="5" stroke="#374151" stroke-width="1" />
        <line x1="5" y1="5" x2="5" :y2="chartData.height - 5" stroke="#374151" stroke-width="1" opacity="0.5" />
        <line :x1="chartData.width - 5" y1="5" :x2="chartData.width - 5" :y2="chartData.height - 5" stroke="#374151" stroke-width="1" opacity="0.5" />
        
        <!-- Multiple line charts -->
        <g v-for="line in chartData.lines" :key="line.name">
          <!-- Line -->
          <polyline
            :points="line.points"
            fill="none"
            :stroke="line.color"
            :stroke-width="chartData.lines.length > 1 ? 1.5 : 2"
            :stroke-dasharray="line.dashed ? '3,3' : 'none'"
            stroke-linecap="round"
            stroke-linejoin="round"
            :opacity="line.dashed ? 0.7 : 1"
          />
          
          <!-- Dots on line (only if single line or less than 20 points) -->
          <g v-if="chartData.lines.length === 1">
            <circle
              v-for="(point, index) in line.points.split(' ')"
              :key="index"
              :cx="point.split(',')[0]"
              :cy="point.split(',')[1]"
              r="2"
              :fill="line.color"
              opacity="0.6"
            />
          </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.space-y-2 > * + * {
  margin-top: 0.5rem;
}

.space-x-1 > * + * {
  margin-left: 0.25rem;
}

.items-end {
  align-items: flex-end;
}

.pt-4 {
  padding-top: 1rem;
}

.border-t {
  border-top-width: 1px;
}

.flex-1 {
  flex: 1 1 0%;
}

.rounded-t {
  border-top-left-radius: 0.25rem;
  border-top-right-radius: 0.25rem;
}

.opacity-60 {
  opacity: 0.6;
}

.hover\:opacity-100:hover {
  opacity: 1;
}

.h-12 {
  height: 3rem;
}

.text-2xl {
  font-size: 1.5rem;
  line-height: 2rem;
}

.bg-opacity-20 {
  --tw-bg-opacity: 0.2;
}

/* Orange color classes for pending divergences */
.bg-orange-500 {
  background-color: rgb(249, 115, 22);
}

.bg-orange-900 {
  background-color: rgb(124, 45, 18);
}

.border-orange-500 {
  border-color: rgb(249, 115, 22);
}

.text-orange-400 {
  color: rgb(251, 146, 60);
}
</style>
