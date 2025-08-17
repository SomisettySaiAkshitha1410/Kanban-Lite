function Avatar({ username, avatar_url, size = 32 }) {
  // Always use fallback if avatar_url is not set
  const src = avatar_url
    ? avatar_url
    : `https://ui-avatars.com/api/?size=${size}&background=0D8ABC&color=fff&name=${encodeURIComponent(username)}`;
  return (
    <img
      src={src}
      alt={username}
      title={username}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        marginRight: 6,
        objectFit: 'cover',
      }}
    />
  );
}
export default Avatar;
