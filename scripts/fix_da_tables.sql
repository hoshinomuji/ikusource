DO $$
BEGIN
    CREATE TYPE da_queue_status AS ENUM ('pending', 'processing', 'done', 'failed');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS directadmin_audit_logs (
    id serial PRIMARY KEY,
    actor_user_id integer REFERENCES users(id),
    target_user_id integer REFERENCES users(id),
    hosting_order_id integer REFERENCES hosting_orders(id),
    action text NOT NULL,
    status text NOT NULL,
    message text,
    metadata text,
    created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS directadmin_queue_jobs (
    id serial PRIMARY KEY,
    action text NOT NULL,
    status da_queue_status NOT NULL DEFAULT 'pending',
    payload text NOT NULL,
    attempts integer NOT NULL DEFAULT 0,
    max_attempts integer NOT NULL DEFAULT 3,
    last_error text,
    run_at timestamp NOT NULL DEFAULT now(),
    processed_at timestamp,
    created_by_user_id integer REFERENCES users(id),
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
);
