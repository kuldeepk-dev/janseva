import { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const MAX_VISIBLE_IMAGES = 5;

type PostImageCarouselProps = {
  imageUrls: string[];
  aspectRatio?: number;
  style?: StyleProp<ViewStyle>;
};

export function PostImageCarousel({
  imageUrls,
  aspectRatio = 1.5,
  style,
}: PostImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleImages = imageUrls.filter(Boolean).slice(0, MAX_VISIBLE_IMAGES);

  if (!visibleImages.length) {
    return null;
  }

  return (
    <View style={[styles.container, { aspectRatio }, style]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        onMomentumScrollEnd={event => {
          const width = Math.max(1, event.nativeEvent.layoutMeasurement.width);
          const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setActiveIndex(nextIndex);
        }}
      >
        {visibleImages.map((uri, index) => {
          return (
            <View key={`${uri}-${index}`} style={styles.slide}>
              <Image source={{ uri }} style={styles.image} resizeMode="cover" />
            </View>
          );
        })}
      </ScrollView>

      {visibleImages.length > 1 ? (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {activeIndex + 1}/{visibleImages.length}
          </Text>
        </View>
      ) : null}

      {visibleImages.length > 1 ? (
        <View style={styles.dots}>
          {visibleImages.map((_, index) => (
            <View
              key={`dot-${index}`}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: "#E8EDF7",
    position: "relative",
  },
  slide: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E8EDF7",
  },
  counter: {
    position: "absolute",
    right: 10,
    top: 10,
    borderRadius: 999,
    backgroundColor: "#00000088",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  dots: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF88",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 18,
  },
});
