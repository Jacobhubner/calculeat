-- Storage-policyn slog bara upp messages.image_path. Nu ligger bilderna i
-- message_attachments, så uppslaget måste täcka BÅDA: gamla meddelanden
-- (image_path) och nya (attachments-tabellen).
DROP POLICY IF EXISTS "message_attachments_select" ON storage.objects;
CREATE POLICY "message_attachments_select"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'message-attachments'
    AND (
      -- Egen mapp
      (storage.foldername(name))[1] = (SELECT auth.uid())::text
      -- Eller: refererad av ett icke-raderat meddelande i min vänskap
      OR EXISTS (
        SELECT 1
        FROM public.message_attachments a
        JOIN public.messages m   ON m.id = a.message_id
        JOIN public.friendships f ON f.id = m.friendship_id
        WHERE a.image_path = storage.objects.name
          AND m.deleted_at IS NULL
          AND (SELECT auth.uid()) IN (f.requester_id, f.addressee_id)
      )
      -- Bakåtkompatibilitet: meddelanden som ännu bara har image_path
      OR EXISTS (
        SELECT 1
        FROM public.messages m
        JOIN public.friendships f ON f.id = m.friendship_id
        WHERE m.image_path = storage.objects.name
          AND m.deleted_at IS NULL
          AND (SELECT auth.uid()) IN (f.requester_id, f.addressee_id)
      )
    )
  );
