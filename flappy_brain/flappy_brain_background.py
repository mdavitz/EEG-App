from PIL import Image, ImageDraw

# Image dimensions
width, height = 640, 480
img = Image.new("RGB", (width, height), (0, 0, 0))
draw = ImageDraw.Draw(img)

# Create gradient background (from dark purple to deep blue)
top_color = (50, 0, 100)    # Dark purple
bottom_color = (0, 0, 30)   # Deep blue
for y in range(height):
    # Interpolate color between top and bottom for each row
    factor = y / height
    r = int(top_color[0] * (1 - factor) + bottom_color[0] * factor)
    g = int(top_color[1] * (1 - factor) + bottom_color[1] * factor)
    b = int(top_color[2] * (1 - factor) + bottom_color[2] * factor)
    draw.line([(0, y), (width, y)], fill=(r, g, b))

# Define grid settings
grid_color = (0, 255, 255)  # Bright cyan for a neon look
horizon = 150               # y-coordinate for the horizon line
num_horiz_lines = 10        # Number of horizontal grid lines

# Draw horizontal lines with quadratic spacing (for perspective effect)
for n in range(num_horiz_lines + 1):
    y = int(horizon + (height - horizon) * (n / num_horiz_lines) ** 2)
    draw.line([(0, y), (width, y)], fill=grid_color)

# Draw vertical lines converging toward the vanishing point (center of horizon)
vanishing_point = (width // 2, horizon)
num_vert_lines = 15
for i in range(num_vert_lines + 1):
    x_bottom = int(i * width / num_vert_lines)
    draw.line([vanishing_point, (x_bottom, height)], fill=grid_color)

# Save and display the image
img.save("flappy_brain_background.png")
img.show()