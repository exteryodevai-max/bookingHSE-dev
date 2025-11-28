-- Fix per politiche RLS mancanti sulla tabella users
-- Questo file risolve l'errore 401 durante la registrazione

-- Aggiunge la policy INSERT mancante per la tabella users
-- Permette agli utenti di inserire il proprio record durante la registrazione
CREATE POLICY "Users can insert their own profile during registration" 
ON users 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Verifica che tutte le policy siano presenti
-- Esegui questa query per verificare le policy esistenti:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'users';