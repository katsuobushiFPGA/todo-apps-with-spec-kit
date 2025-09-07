/**
 * Task Service - API通信レイヤー
 * バックエンドのREST APIとの通信を担当
 */

const API_BASE_URL = 'http://localhost:3001/api';

/**
 * APIリクエストのベース設定
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request failed for ${endpoint}:`, error);
    throw error;
  }
};

/**
 * タスク管理API service
 */
export const taskService = {
  /**
   * 新しいタスクを作成
   * @param {Object} taskData - タスクデータ
   * @param {string} taskData.title - タスクのタイトル
   * @param {string} [taskData.dueDate] - 期限日 (ISO 8601形式)
   * @returns {Promise<Object>} 作成されたタスク
   */
  async createTask(taskData) {
    const response = await apiRequest('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return response.data;
  },

  /**
   * タスク一覧を取得
   * @param {Object} [params] - クエリパラメータ
   * @param {string} [params.orderBy] - ソート順 ('created' | 'dueDate')
   * @param {boolean} [params.completed] - 完了状態でフィルタ
   * @returns {Promise<Object>} タスク一覧とメタデータ
   */
  async getTasks(params = {}) {
    const queryString = new URLSearchParams(
      Object.entries(params).filter(([_, value]) => value != null)
    ).toString();
    
    const endpoint = `/tasks${queryString ? `?${queryString}` : ''}`;
    const response = await apiRequest(endpoint);
    
    return {
      tasks: response.data.tasks,
      pagination: response.data.pagination,
      filters: response.data.filters,
      sort: response.data.sort,
    };
  },

  /**
   * タスクを更新
   * @param {number} taskId - タスクID
   * @param {Object} updateData - 更新データ
   * @param {string} [updateData.title] - タスクのタイトル
   * @param {string} [updateData.dueDate] - 期限日
   * @param {number} [updateData.progress] - 進捗率 (0-100)
   * @param {boolean} [updateData.completed] - 完了状態
   * @returns {Promise<Object>} 更新されたタスク
   */
  async updateTask(taskId, updateData) {
    const response = await apiRequest(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return response.data;
  },

  /**
   * タスクを削除
   * @param {number} taskId - タスクID
   * @returns {Promise<void>}
   */
  async deleteTask(taskId) {
    await apiRequest(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  },

  /**
   * タスクの進捗を更新
   * @param {number} taskId - タスクID
   * @param {number} progress - 進捗率 (0-100)
   * @returns {Promise<Object>} 更新されたタスク
   */
  async updateProgress(taskId, progress) {
    return this.updateTask(taskId, { progress });
  },

  /**
   * タスクの完了状態を切り替え
   * @param {number} taskId - タスクID
   * @param {boolean} completed - 完了状態
   * @returns {Promise<Object>} 更新されたタスク
   */
  async toggleComplete(taskId, completed) {
    return this.updateTask(taskId, { completed });
  },
};

/**
 * API エラーハンドリング用のユーティリティ
 */
export const handleApiError = (error) => {
  if (error.message.includes('Failed to fetch')) {
    return 'サーバーに接続できません。ネットワーク接続を確認してください。';
  }
  
  if (error.message.includes('400')) {
    return '入力データに問題があります。入力内容を確認してください。';
  }
  
  if (error.message.includes('404')) {
    return '指定されたタスクが見つかりません。';
  }
  
  if (error.message.includes('500')) {
    return 'サーバーエラーが発生しました。しばらく時間を置いてから再試行してください。';
  }
  
  return error.message || '不明なエラーが発生しました。';
};

export default taskService;
