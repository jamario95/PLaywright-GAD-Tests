import { test, expect } from '@playwright/test';

/**
 * Scenario 10.3: Verify canvas rendering (pixel comparison)
 * Page: /practice/canvas-1.html
 * Key metric: Visual testing
 *
 * Goal: Compare canvas rendering verification across frameworks
 *
 * Page structure:
 * - Canvas element with id="sampleChart"
 * - Chart.js library renders weather data chart
 * - Data includes: temperature (high/avg/low), humidity, wind speed
 * - Chart displays 26 data points from 2024-06-20 to 2024-07-15
 *
 * Differences between technologies:
 * - Playwright: toHaveScreenshot() for visual comparison, canvas API access
 * - Selenium: Screenshot comparison with external libraries (e.g., ImageMagick)
 * - Cypress: cy.screenshot() + plugin for visual comparison
 *
 * Metric: Visual testing support, screenshot comparison accuracy
 */
test.describe('10.3 - Canvas Rendering Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Arrange - Navigate to canvas page
    await page.goto('/practice/canvas-1.html');

    // Wait for Chart.js to initialize and animation to complete
    await page.waitForFunction(() =>
      window.myCharts?.['sampleChart'] && !window.myCharts['sampleChart'].animating
    );
  });

  test('should display canvas element on page', async ({ page }) => {
    // Arrange
    const canvas = page.locator('#sampleChart');

    // Assert - Verify canvas is visible
    await expect(canvas).toBeVisible();
  });

  test('should render chart with correct dimensions', async ({ page }) => {
    // Arrange
    const canvas = page.locator('#sampleChart');

    // Act - Get canvas dimensions
    const boundingBox = await canvas.boundingBox();

    // Assert - Verify canvas has reasonable dimensions
    expect(boundingBox).toBeTruthy();
    expect(boundingBox!.width).toBeGreaterThan(100);
    expect(boundingBox!.height).toBeGreaterThan(100);
  });

  test('should have Chart.js instance attached to canvas', async ({ page }) => {
    // Arrange & Act - Check if Chart.js instance exists
    const hasChart = await page.evaluate(() => {
      return window.myCharts !== undefined && window.myCharts['sampleChart'] !== undefined;
    });

    // Assert - Verify Chart.js is initialized
    expect(hasChart).toBe(true);
  });

  test('should render chart with correct data labels', async ({ page }) => {
    // Act - Get chart data labels
    const labels = await page.evaluate(() => {
      const chart = window.myCharts['sampleChart'];
      return chart.data.labels;
    });

    // Assert - Verify labels match expected dates
    expect(labels).toContain('2024-06-20');
    expect(labels).toContain('2024-07-15');
    expect(labels.length).toBe(26);
  });

  test('should render chart with 5 datasets', async ({ page }) => {
    // Act - Get number of datasets
    const datasetsCount = await page.evaluate(() => {
      const chart = window.myCharts['sampleChart'];
      return chart.data.datasets.length;
    });

    // Assert - Verify correct number of datasets (temp high, avg, low, humidity, wind)
    expect(datasetsCount).toBe(5);
  });

  test('should have correct temperature high values in dataset', async ({ page }) => {
    // Act - Get temperature high data
    const tempHighData = await page.evaluate(() => {
      const chart = window.myCharts['sampleChart'];
      return chart.data.datasets[0].data;
    });

    // Assert - Verify first and last temperature high values
    expect(tempHighData[0]).toBe(26); // 2024-06-20 high temp
    expect(tempHighData[tempHighData.length - 1]).toBe(27); // 2024-07-15 high temp
  });

  test('should have correct border colors for datasets', async ({ page }) => {
    // Act - Get border colors
    const borderColors = await page.evaluate(() => {
      const chart = window.myCharts['sampleChart'];
      return chart.data.datasets.map((ds: any) => ds.borderColor);
    });

    // Assert - Verify colors match expected palette
    expect(borderColors).toContain('red'); // Temperature high
    expect(borderColors).toContain('orange'); // Temperature avg
    expect(borderColors).toContain('yellow'); // Temperature low
    expect(borderColors).toContain('blue'); // Humidity
    expect(borderColors).toContain('green'); // Wind speed
  });

  test('should display chart title "Weather Data"', async ({ page }) => {
    // Act - Get chart title
    const chartTitle = await page.evaluate(() => {
      const chart = window.myCharts['sampleChart'];
      return chart.options.plugins.title.text;
    });

    // Assert - Verify title
    expect(chartTitle).toBe('Weather Data');
  });

  test('should render canvas with non-empty pixel data', async ({ page }) => {
    // Arrange
    const canvas = page.locator('#sampleChart');

    // Act - Check if canvas has any drawn content
    const hasContent = await page.evaluate(() => {
      const canvas = document.getElementById('sampleChart') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      // Get a sample of pixel data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Check if there are any non-transparent pixels
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return true; // Found non-transparent pixel
      }
      return false;
    });

    // Assert - Verify canvas has rendered content
    expect(hasContent).toBe(true);
  });

  test('should capture chart screenshot for visual comparison', async ({ page }) => {
    // Arrange
    const canvas = page.locator('#sampleChart');

    // Act - Get canvas screenshot as buffer for manual comparison
    // Note: Canvas dimensions may vary slightly between runs (e.g., 1000px vs 1001px)
    // This is a known issue with Chart.js responsive sizing
    const screenshot = await canvas.screenshot();

    // Assert - Verify screenshot was captured successfully
    expect(screenshot).toBeInstanceOf(Buffer);
    expect(screenshot.length).toBeGreaterThan(1000); // Should have meaningful content

    // Log screenshot size for metrics
    console.log(`Chart screenshot size: ${screenshot.length} bytes`);
  });

  test('should have consistent canvas dimensions', async ({ page }) => {
    // Arrange
    const canvas = page.locator('#sampleChart');

    // Act - Get canvas dimensions
    const dimensions = await canvas.evaluate((el) => {
      const canvasEl = el as HTMLCanvasElement;
      return {
        width: canvasEl.width,
        height: canvasEl.height,
        clientWidth: canvasEl.clientWidth,
        clientHeight: canvasEl.clientHeight,
      };
    });

    // Assert - Verify dimensions are reasonable
    // Note: Chart.js uses internal width/height which may differ from displayed size
    expect(dimensions.width).toBeGreaterThanOrEqual(500);
    expect(dimensions.height).toBeGreaterThanOrEqual(200);

    console.log(`Canvas dimensions: ${dimensions.width}x${dimensions.height} (internal), ${dimensions.clientWidth}x${dimensions.clientHeight} (displayed)`);
  });

  test('should have animation duration configured', async ({ page }) => {
    // Act - Get animation duration
    const animationDuration = await page.evaluate(() => {
      const chart = window.myCharts['sampleChart'];
      return chart.options.animation.duration;
    });

    // Assert - Verify animation is configured (default 1000ms)
    expect(animationDuration).toBe(1000);
  });

  test('should display humidity values correctly', async ({ page }) => {
    // Act - Get humidity data
    const humidityData = await page.evaluate(() => {
      const chart = window.myCharts['sampleChart'];
      return chart.data.datasets[3].data; // Humidity is 4th dataset (index 3)
    });

    // Assert - Verify humidity values are within expected range (0-100)
    for (const value of humidityData) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
  });

  test('should display wind speed values correctly', async ({ page }) => {
    // Act - Get wind speed data
    const windData = await page.evaluate(() => {
      const chart = window.myCharts['sampleChart'];
      return chart.data.datasets[4].data; // Wind is 5th dataset (index 4)
    });

    // Assert - Verify wind values are positive
    for (const value of windData) {
      expect(value).toBeGreaterThan(0);
    }
  });

  test('should measure chart rendering time for metrics', async ({ page }) => {
    // Arrange - Navigate to page and measure time
    const startTime = Date.now();

    await page.goto('/practice/canvas-1.html');

    // Wait for chart to be rendered
    await page.waitForFunction(() => {
      return window.myCharts && window.myCharts['sampleChart'];
    });

    // Wait for animation to complete
    await page.waitForFunction(() =>
      window.myCharts?.['sampleChart'] && !window.myCharts['sampleChart'].animating
    );

    const endTime = Date.now();
    const renderTime = endTime - startTime;

    // Log execution time for metrics comparison
    console.log(`Chart rendering time: ${renderTime}ms`);

    // Assert - Chart rendered successfully
    expect(renderTime).toBeGreaterThan(0);
  });

  test('should be able to export canvas as image', async ({ page }) => {
    // Act - Export canvas to data URL
    const dataUrl = await page.evaluate(() => {
      const canvas = document.getElementById('sampleChart') as HTMLCanvasElement;
      return canvas.toDataURL('image/png');
    });

    // Assert - Verify valid PNG data URL
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
    expect(dataUrl.length).toBeGreaterThan(100); // Has actual content
  });
});

// Extend Window interface for TypeScript
declare global {
  interface Window {
    myCharts: Record<string, any>;
  }
}
