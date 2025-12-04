import { useEffect, useRef } from 'react';
import {
	Chart as ChartJS,
	ArcElement,
	LineElement,
	BarElement,
	PointElement,
	CategoryScale,
	LinearScale,
	Title,
	Tooltip,
	Legend,
	PieController,
	LineController,
	BarController
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
	ArcElement,
	LineElement,
	BarElement,
	PointElement,
	CategoryScale,
	LinearScale,
	Title,
	Tooltip,
	Legend,
	PieController,
	LineController,
	BarController,
	ChartDataLabels
);

interface QueryResultRow {
	countpass?: number;
	countfail?: number;
	sections_year?: number;
	yearAVG?: number;
	sections_dept?: string;
	count?: number;
	[key: string]: string | number | undefined;
}

interface ChartData {
	result: QueryResultRow[];
	queryType: string;
}

interface ChartDisplayProps {
	chartData: ChartData | null;
}
 // Claude told me to use the ChartDataLabels from 'chartjs-plugin-datalabels'
// and helped me with some parts of the rendering of charts
function DisplayChart({ chartData }: ChartDisplayProps) {
	const chartRef = useRef<HTMLCanvasElement | null>(null);
	const chartInstance = useRef<ChartJS | null>(null);

	useEffect(() => {
		if (!chartData || !chartRef.current) {
			if (chartInstance.current) {
				chartInstance.current.destroy();
				chartInstance.current = null;
			}
			return;
		}

		if (chartInstance.current) {
			chartInstance.current.destroy();
			chartInstance.current = null;
		}

		const chartResult = chartRef.current.getContext('2d');
		if (!chartResult) {
			return;
		}
		try {
			const getCSSVariable = (varName: string): string => {
				return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
			};

			const titleColor = getCSSVariable('--color-chart-title');
			const subtitleColor = getCSSVariable('--color-chart-subtitle');
			const chartColor1 = getCSSVariable('--color-chart-1');
			const chartColor2 = getCSSVariable('--color-chart-2');

			const { result, queryType } = chartData;

			if (!Array.isArray(result)) {
				return;
			}

			if (queryType === '1') {
				// countfail: 51, countpass: 234
				const pass = result.reduce((sum: number, row: QueryResultRow) => sum + (row.countpass || 0), 0);
				const fail = result.reduce((sum: number, row: QueryResultRow) => sum + (row.countfail || 0), 0);
				const total = pass + fail;
				const passPercent = total > 0 ? ((pass / total) * 100).toFixed(1) : '0.0';
				const failPercent = total > 0 ? ((fail / total) * 100).toFixed(1) : '0.0';

				chartInstance.current = new ChartJS(chartRef.current, {
					type: 'pie',
					data: {
						labels: ['Pass', 'Fail'],
						datasets: [{
							data: [pass, fail],
							backgroundColor: [chartColor1, chartColor2]
						}]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						layout: {
							padding: {
								top: 0,
								bottom: 0,
								left: 0,
								right: 0
							}
						},
						plugins: {
							legend: {
								position: 'bottom',
								labels: {
									font: {
										family: 'Nunito',
										size: 14,
										weight: 'bold'
									},
									color: subtitleColor
								}
							},
							title: {
								display: true,
								text: 'CPSC Courses Pass/Fail Distribution',
								font: {
									family: 'Nunito',
									size: 16,
									weight: 'bold'
								},
								color: titleColor,
								padding: {
									top: 0,
									bottom: 10
								}
							},
							tooltip: {
								callbacks: {
									label: (context: { label?: string; parsed?: number }) => {
										const label = context.label || '';
										const value = context.parsed || 0;
										const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
										return `${label}: ${value} (${percent}%)`;
									}
								}
							},
							datalabels: {
								display: true,
								color: subtitleColor,
								font: {
									family: 'Nunito',
									size: 12,
									weight: 'bold'
								},
								formatter: (_value: number, context: { dataIndex: number }) => {
									const index = context.dataIndex;
									return [passPercent, failPercent][index] + '%';
								},
								anchor: 'end',
								align: 'end',
								offset: 0
							}
						}
					}
				});
				} else if (queryType === '2') {

				// ChatGPT helped me to find and fetch the year field dynamically
				const yearKey = result.length > 0 ? Object.keys(result[0] || {}).
				find(key => key.includes('_year')) || 'sections_year' : 'sections_year';

				const dataWithYear = result.map((row: QueryResultRow) => ({
					year: row[yearKey] !== undefined && row[yearKey] !== null ? Number(row[yearKey]) : 0,
					avg: parseFloat((row.yearAVG || 0).toFixed(2))
				}));

				dataWithYear.sort((a, b) => a.year - b.year);

				const years = dataWithYear.map(item => item.year);
				const avgs = dataWithYear.map(item => item.avg);

				chartInstance.current = new ChartJS(chartRef.current, {
					type: 'line',
					data: {
						labels: years,
						datasets: [{
							label: 'Average Grade',
							data: avgs,
							borderColor: chartColor1,
							backgroundColor: chartColor1 + '33',
							tension: 0.4,
							borderWidth: 3,
							pointRadius: 6,
							pointBackgroundColor: chartColor2,
							pointBorderColor: '#fff',
							pointBorderWidth: 2
						}]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						layout: {
							padding: {
								top: 0,
								bottom: 0,
								left: 0,
								right: 0
							}
						},
						plugins: {
							legend: {
								position: 'bottom',
								labels: {
									font: {
										family: 'Nunito',
										size: 14,
										weight: 'bold'
									},
									color: subtitleColor
								}
							},
							title: {
								display: true,
								text: '2011-2016 CPSC Course Average Change',
								font: {
									family: 'Nunito',
									size: 16,
									weight: 'bold'
								},
								color: titleColor,
								padding: {
									top: 0,
									bottom: 10
								}
							},
							datalabels: {
								display: true,
								color: subtitleColor,
								font: {
									family: 'Nunito',
									size: 12,
									weight: 'bold'
								},
								formatter: (value: number) => value.toFixed(2),
								anchor: 'end',
								align: 'top',
								offset: 0
							}
						},
						scales: {
							y: {
								beginAtZero: false,
								title: {
									display: true,
									text: 'Average Grade',
									font: {
										family: 'Nunito',
										size: 12,
										weight: 'bold'
									},
									color: subtitleColor
								},
								ticks: {
									font: {
										family: 'Nunito',
										size: 12,
										weight: 'bold'
									},
									color: subtitleColor
								},
								grid: {
									color: chartColor1 + '1A'
								}
							},
							x: {
								type: 'category',
								title: {
									display: true,
									text: 'Year',
									font: {
										family: 'Nunito',
										size: 12,
										weight: 'bold'
									},
									color: subtitleColor
								},
								ticks: {
									font: {
										family: 'Nunito',
										size: 12,
										weight: 'bold'
									},
									color: subtitleColor
								},
								grid: {
									color: chartColor1 + '1A'
								}
							}
						}
					}
				});
				} else if (queryType === '3') {

				const deptKey = result.length > 0 ? Object.keys(result[0] || {}).
				find(key => key.includes('_dept')) || 'sections_dept' : 'sections_dept';
				const depts = result.map((row: QueryResultRow) => {
					const dept = row[deptKey];
					return dept !== undefined && dept !== null ? String(dept) : '';
				});
				const counts = result.map((row: QueryResultRow) => row.count || 0);

				chartInstance.current = new ChartJS(chartRef.current, {
					type: 'bar',
					data: {
						labels: depts,
						datasets: [{
							label: 'Fail Count',
							data: counts,
							backgroundColor: chartColor1 + 'CC',
							borderColor: chartColor2,
							borderWidth: 2,
							borderRadius: 8
						}]
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						layout: {
							padding: {
								top: 0,
								bottom: 0,
								left: 0,
								right: 0
							}
						},
						plugins: {
							legend: {
								position: 'bottom',
								labels: {
									font: {
										family: 'Nunito',
										size: 14,
										weight: 'bold'
									},
									color: subtitleColor
								}
							},
							title: {
								display: true,
								text: 'Counts of Sections with Fail Count > 150 in Each Departments',
								font: {
									family: 'Nunito',
									size: 16,
									weight: 'bold'
								},
								color: titleColor,
								padding: {
									top: 0,
									bottom: 10
								}
							},
							datalabels: {
								display: true,
								color: subtitleColor,
								font: {
									family: 'Nunito',
									size: 12,
									weight: 'bold'
								},
								formatter: (value: number) => value.toString(),
								anchor: 'end',
								align: 'top',
								offset: -5
							}
						},
						scales: {
							y: {
								beginAtZero: true,
								title: {
									display: true,
									text: 'Fail Count',
									font: {
										family: 'Nunito',
										size: 12,
										weight: 'bold'
									},
									color: subtitleColor
								},
								ticks: {
									font: {
										family: 'Nunito',
										size: 12,
										weight: 'bold'
									},
									color: subtitleColor
								},
								grid: {
									color: chartColor1 + '1A'
								}
							},
							x: {
								type: 'category',
								title: {
									display: true,
									text: 'Department',
									font: {
										family: 'Nunito',
										size: 12,
										weight: 'bold'
									},
									color: subtitleColor
								},
								ticks: {
									font: {
										family: 'Nunito',
										size: 12,
										weight: 'bold'
									},
									color: subtitleColor,
									maxRotation: 45,
									minRotation: 0
								},
								grid: {
									color: chartColor1 + '1A'
								}
							}
						}
					}
				});
			}
		} catch (error) {
			console.error('DisplayChart: Error rendering chart', error);
		}

		return () => {
			if (chartInstance.current) {
				chartInstance.current.destroy();
			}
		};
	}, [chartData]);

	return (
		<div className="w-full h-full">
			<div className="chart-canvas-wrapper mt-1">
				<canvas ref={chartRef}></canvas>
			</div>
		</div>
	);
}

export default DisplayChart;
