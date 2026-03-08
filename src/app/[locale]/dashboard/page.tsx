'use client';

import React from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import Image from 'next/image';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const DashboardHome = () => {
  const stats = [
    {
      id: 1,
      title: 'Total Earning',
      value: '$10,236',
      change: '+4.01%',
      icon: '💰',
      chartData: [10, 15, 12, 18, 14, 16],
      color: 'indigo'
    },
    {
      id: 2,
      title: 'Daily Customers',
      value: '36,531',
      change: '+3.01%',
      icon: '👥',
      chartData: [15, 12, 18, 14, 16, 13],
      color: 'yellow'
    },
    {
      id: 3,
      title: 'New Orders',
      value: '52,416',
      change: '+2.01%',
      icon: '📦',
      chartData: [12, 18, 14, 16, 13, 15],
      color: 'blue'
    },
    {
      id: 4,
      title: 'New Feedback',
      value: '13,924',
      change: '+0.21%',
      icon: '👍',
      chartData: [18, 14, 16, 13, 15, 12],
      color: 'cyan'
    }
  ];

  const topSellingItems = [
    {
      name: 'Pizza Margherita',
      restaurant: 'Deli Cafe',
      price: '$34.24',
      image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=80&h=80&fit=crop'
    },
    {
      name: 'Classic Caesar Salad',
      restaurant: 'Deli Cafe',
      price: '$28.21',
      image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=80&h=80&fit=crop'
    },
    {
      name: 'Egg Sandwich',
      restaurant: 'Good Food',
      price: '$30.15',
      image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=80&h=80&fit=crop'
    },
    {
      name: 'Muesli with Mango',
      restaurant: 'Deli Cafe',
      price: '$40.24',
      image: 'https://images.unsplash.com/photo-1541411438265-4cb4687110f2?w=80&h=80&fit=crop'
    }
  ];

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 0,
      },
    },
  };

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat) => (
          <div key={stat.id} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <div className="flex items-baseline">
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                  <span className={`ml-2 text-sm font-medium text-green-500`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div className="h-16">
              <Line
                data={{
                  labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                  datasets: [
                    {
                      data: stat.chartData,
                      borderColor: `rgb(99, 102, 241)`,
                      backgroundColor: `rgba(99, 102, 241, 0.1)`,
                      fill: true,
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Summary</h2>
            <select className="text-sm border rounded-lg px-3 py-1">
              <option>Last Week</option>
              <option>Last Month</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px]">
            <Line
              data={{
                labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                datasets: [
                  {
                    label: 'Earnings',
                    data: [4000, 3000, 6000, 5000, 3000, 4000, 3000],
                    borderColor: 'rgb(99, 102, 241)',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    fill: true,
                  },
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                  },
                },
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Top Selling Items</h2>
            <button className="text-sm text-indigo-600 hover:text-indigo-800">View all</button>
          </div>
          <div className="space-y-6">
            {topSellingItems.map((item, index) => (
              <div key={index} className="flex items-center space-x-4">
                <Image
                  src={item.image}
                  alt={item.name}
                  width={48}
                  height={48}
                  className="rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="text-sm font-medium">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.restaurant}</p>
                </div>
                <span className="text-sm font-medium">{item.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardHome;
