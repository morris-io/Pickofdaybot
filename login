<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login - YourCapper</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-gray-50 text-gray-800">
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="container mx-auto px-6 py-4 flex justify-between items-center">
        <a href="/home" class="text-2xl font-bold text-blue-700">YourCapper</a>
        <nav class="space-x-6">
          <a href="/register" class="bg-blue-700 text-white px-4 py-2 rounded hover:bg-blue-800 transition">Sign Up</a>
        </nav>
      </div>
    </header>

    <!-- Login Form -->
    <section class="flex items-center justify-center min-h-screen py-12">
      <div class="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h1 class="text-3xl font-bold text-center text-blue-700 mb-8">Welcome Back</h1>

        <form action="/dashboard" method="POST" class="space-y-6">
          <div>
            <label for="email" class="block text-gray-700 font-medium mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              required
              class="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-gray-700 font-medium mb-2">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              required
              class="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            class="w-full bg-blue-700 text-white font-bold py-3 rounded hover:bg-blue-800 transition"
          >
            Log In
          </button>
        </form>

        <p class="text-center text-gray-600 mt-6">
          Don’t have an account?
          <a href="/register" class="text-blue-700 font-semibold hover:underline">Sign up</a>
        </p>
      </div>
    </section>

    <footer class="bg-gray-900 text-gray-400 py-6 text-center">
      &copy; 2025 YourCapper. All rights reserved.
    </footer>
  </body>
</html>
