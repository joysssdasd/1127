import os
import psycopg

DB_URL = os.environ.get('SUPABASE_DB_URL')
if not DB_URL:
    raise SystemExit('SUPABASE_DB_URL environment variable not provided')

STATEMENTS = [
    'DROP TABLE IF EXISTS contact_views, deal_stats, point_transactions, recharge_tasks, search_history, posts, users CASCADE',
    'CREATE EXTENSION IF NOT EXISTS "pgcrypto"',
    '''CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        phone varchar(20) UNIQUE,
        wechat_openid text UNIQUE,
        wechat_unionid text,
        points integer DEFAULT 0,
        total_deals integer DEFAULT 0,
        status varchar(20) DEFAULT 'pending',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    )''',
    '''CREATE TABLE posts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id),
        title varchar(120) NOT NULL,
        description text NOT NULL,
        price numeric(10,2) NOT NULL,
        trade_type varchar(20) NOT NULL,
        keywords text[] DEFAULT '{}',
        ai_summary text,
        remaining_views integer DEFAULT 10,
        view_limit integer DEFAULT 10,
        total_deals integer DEFAULT 0,
        status varchar(20) DEFAULT 'active',
        expires_at timestamptz NOT NULL,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    )''',
    'CREATE INDEX idx_posts_user ON posts(user_id)',
    'CREATE INDEX idx_posts_status_expires ON posts(status, expires_at)',
    '''CREATE TABLE contact_views (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id uuid NOT NULL REFERENCES posts(id),
        buyer_id uuid NOT NULL REFERENCES users(id),
        seller_id uuid NOT NULL REFERENCES users(id),
        deducted_points integer NOT NULL,
        copied boolean DEFAULT true,
        copied_at timestamptz,
        confirm_status varchar(20) DEFAULT 'pending',
        confirm_payload text,
        confirm_deadline timestamptz NOT NULL,
        created_at timestamptz DEFAULT now()
    )''',
    'CREATE INDEX idx_contact_views_post ON contact_views(post_id)',
    '''CREATE TABLE deal_stats (
        post_id uuid PRIMARY KEY REFERENCES posts(id),
        seller_id uuid NOT NULL REFERENCES users(id),
        total_deals integer DEFAULT 0,
        updated_at timestamptz DEFAULT now()
    )''',
    '''CREATE TABLE point_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id),
        change_type varchar(20) NOT NULL,
        amount integer NOT NULL,
        balance_after integer NOT NULL,
        description text,
        reference_id uuid,
        created_at timestamptz DEFAULT now()
    )''',
    'CREATE INDEX idx_point_tx_user ON point_transactions(user_id)',
    '''CREATE TABLE recharge_tasks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id),
        amount integer NOT NULL,
        voucher_url text NOT NULL,
        status varchar(20) DEFAULT 'pending',
        remind_count integer DEFAULT 0,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
    )''',
    '''CREATE TABLE search_history (
        id bigserial PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id),
        keyword text NOT NULL,
        created_at timestamptz DEFAULT now()
    )''',
    'CREATE UNIQUE INDEX idx_search_history_user_keyword ON search_history(user_id, keyword)'
]

def main():
    with psycopg.connect(DB_URL, autocommit=True) as conn:
        with conn.cursor() as cur:
            for statement in STATEMENTS:
                cur.execute(statement)
    print('Supabase schema ready.')

if __name__ == '__main__':
    main()
