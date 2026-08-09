import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "한끼이음 MealLink",
    short_name: "한끼이음",
    description: "후원한 식사권이 따뜻한 한 끼로 이어지는 과정을 확인하세요.",
    start_url: "/",
    display: "standalone",
    background_color: "#fdfcf9",
    theme_color: "#176b58",
    orientation: "portrait",
  };
}
