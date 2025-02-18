export interface FacebookPost {
  id: string;
  message?: string;
  created_time: string;
  admin_creator?: {
    name: string;
    id: string;
  };
  from: {
    name: string;
    id: string;
  };
  likes: {
    summary: {
      total_count: number;
    };
  };
  comments: {
    summary: {
      total_count: number;
    };
  };
  shares?: {
    count: number;
  };
  insights: {
    data: {
      name: string;
      period: string;
      values: Array<{
        value: number;
      }>;
    }[];
  };
}

export interface DateRange {
  from: Date;
  to: Date;
}

export interface Performance {
  totals: {
    likes: number;
    comments: number;
    shares: number;
    posts: number;
  };
  periodTargets: {
    likes: number;
    comments: number;
    shares: number;
    posts: number;
  };
  scores: {
    likes: number;
    comments: number;
    shares: number;
    posts: number;
  };
  overallScore: number;
}

export interface FacebookVideo {
  id: string;
  title: string;
  description?: string;
  created_time: string;
  updated_time: string;
  length: number;
  views: number;
  source: string;
  picture: string;
  likes: {
    summary: {
      total_count: number;
    };
  };
  comments: {
    summary: {
      total_count: number;
    };
  };
  shares?: {
    count: number;
  };
  insights: {
    data: {
      name: string;
      period: string;
      values: Array<{
        value: number;
      }>;
    }[];
  };
}

export interface FacebookFollowers {
  total_count: number;
  demographics: {
    age_gender: {
      data: Array<{
        gender: string;
        age_range: string;
        value: number;
      }>;
    };
    countries: {
      data: Array<{
        name: string;
        value: number;
      }>;
    };
    cities: {
      data: Array<{
        name: string;
        value: number;
      }>;
    };
  };
  growth: {
    data: Array<{
      date: string;
      value: number;
    }>;
  };
  online_presence: {
    data: Array<{
      hour: number;
      value: number;
    }>;
  };
}

export interface FacebookInsights {
  data: Array<{
    name: string;
    period: string;
    values: Array<{
      end_time: string;
      value: number;
    }>;
  }>;
}
