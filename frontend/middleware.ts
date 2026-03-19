export { default } from "next-auth/middleware"

export const config = {
  matcher: ["/patient/:path*", "/insurance/:path*"]
}
