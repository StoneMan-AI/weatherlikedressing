import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import './Products.css';

const Products = () => {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['products', page, category, user?.country_code],
    queryFn: async () => {
      const params = { page, limit: 12, country_code: user?.country_code };
      if (category) params.category = category;
      const res = await axios.get('/api/products', { params });
      return res.data.data;
    }
  });

  const addToCart = (product) => {
    // 简单的购物车功能，这里可以后续扩展
    alert(`已将 ${product.title_cn || product.title_en} 加入购物车`);
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="text-center">加载中...</div>
      </div>
    );
  }

  return (
    <div className="products-page container">
      <h1 className="page-title">商品商城</h1>

      {user?.country_code === 'CN' ? (
        <>
          <div className="products-filters">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="input"
              style={{ maxWidth: '200px' }}
            >
              <option value="">全部分类</option>
              <option value="clothing">服装</option>
              <option value="accessories">配饰</option>
              <option value="underwear">内衣</option>
            </select>
          </div>

          <div className="products-grid">
            {data?.products?.map(product => (
              <div key={product.id} className="product-card card">
                {product.thumbnail_url && (
                  <img
                    src={product.thumbnail_url}
                    alt={product.title_cn || product.title_en}
                    className="product-image"
                  />
                )}
                <div className="product-info">
                  <h3 className="product-title">
                    {product.title_cn || product.title_en}
                  </h3>
                  <p className="product-price">
                    ¥{parseFloat(product.price_cny).toFixed(2)}
                  </p>
                  <button
                    onClick={() => addToCart(product)}
                    className="btn btn-primary"
                    disabled={product.stock_qty <= 0}
                  >
                    {product.stock_qty > 0 ? '加入购物车' : '缺货'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {data?.pagination && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                上一页
              </button>
              <span>
                第 {data.pagination.page} 页 / 共 {data.pagination.totalPages} 页
              </span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="btn btn-secondary"
              >
                下一页
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="card text-center">
          <p className="text-gray">
            商城功能目前仅对中国大陆用户开放
          </p>
        </div>
      )}
    </div>
  );
};

export default Products;
