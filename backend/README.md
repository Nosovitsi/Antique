# Antique Feed Backend

This is the Python backend for the Antique Feed application.

## Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Install the dependencies using `pipenv`:
    ```bash
    pipenv install
    ```

## Running the Application

To run the Flask development server:

```bash
pipenv run python run.py
```

## Initializing Supabase (if not already done)

Locate the `supabase` directory and do:

1. All tables from /supabase/tables should be created in the Supabase project.
    - Dashboard / SQL Editor / Run SQL
    - Copy the content of the file `/supabase/tables/live_sessions.sql` and so on and paste one after another in the SQL editor.
2. All functions from /supabase/edge-functions should be created in the Supabase project.
    - Dashboard / Edge Functions / Create a new function
    - Copy the content of the file `/supabase/edge-functions/product-image-upload/index.py` and paste it in the editor.
    - Name the function `product-image-upload`.

The API will be available at `http://127.0.0.1:5174`.
