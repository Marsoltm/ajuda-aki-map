create policy "admin_envia_fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'anuncios' and public.has_role(auth.uid(), 'admin'));
create policy "admin_le_fotos" on storage.objects for select to authenticated
  using (bucket_id = 'anuncios' and public.has_role(auth.uid(), 'admin'));
create policy "admin_apaga_fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'anuncios' and public.has_role(auth.uid(), 'admin'));