import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import './Orders.css';

const Orders = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const res = await axios.get('/api/orders');
      return res.data.data;
    }
  });

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: '待支付',
      paid: '已支付',
      shipped: '已发货',
      delivered: '已完成',
      cancelled: '已取消'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      pending: '#FF9800',
      paid: '#4CAF50',
      shipped: '#2196F3',
      delivered: '#4CAF50',
      cancelled: '#999999'
    };
    return colorMap[status] || '#666666';
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="orders-page container">
      <h1 className="page-title">我的订单</h1>

      {data && data.length > 0 ? (
        <div className="orders-list">
          {data.map(order => (
            <div key={order.id} className="order-card card">
              <div className="order-header">
                <div>
                  <span className="order-number">订单号：{order.order_no}</span>
                  <span className="order-date">
                    {new Date(order.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>
                <span
                  className="order-status"
                  style={{ color: getStatusColor(order.status) }}
                >
                  {getStatusLabel(order.status)}
                </span>
              </div>

              {order.items && order.items.length > 0 && (
                <div className="order-items">
                  {order.items.map(item => (
                    <div key={item.id} className="order-item">
                      {item.thumbnail_url && (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title_cn || item.title_en}
                          className="order-item-image"
                        />
                      )}
                      <div className="order-item-info">
                        <div className="order-item-name">
                          {item.title_cn || item.title_en}
                        </div>
                        <div className="order-item-details">
                          <span>数量：{item.qty}</span>
                          <span>单价：¥{parseFloat(item.unit_price).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="order-footer">
                <span className="order-total">
                  总计：¥{parseFloat(order.total_amount_cny).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center">
          <p className="text-gray">暂无订单</p>
        </div>
      )}
    </div>
  );
};

export default Orders;
