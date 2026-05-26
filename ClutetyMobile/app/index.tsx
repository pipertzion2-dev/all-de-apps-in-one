import Constants from "expo-constants";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview";

const DEFAULT_URL =
  (Constants.expoConfig?.extra as { clutetyWebUrl?: string } | undefined)?.clutetyWebUrl ??
  "https://svivva.com/clutety/app";

/** Standalone Clutety iOS app — loads the Svivva-hosted Clutety experience. */
export default function ClutetyScreen() {
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  const onNavChange = useCallback((nav: WebViewNavigation) => {
    setCanGoBack(nav.canGoBack);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <View style={styles.container}>
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="large" color="#5BA8A0" />
          </View>
        )}
        <WebView
          ref={webRef}
          source={{ uri: DEFAULT_URL }}
          style={styles.web}
          onLoadEnd={() => setLoading(false)}
          onNavigationStateChange={onNavChange}
          allowsBackForwardNavigationGestures={canGoBack}
          pullToRefreshEnabled={Platform.OS === "ios"}
          sharedCookiesEnabled
          thirdPartyCookiesEnabled
          setSupportMultipleWindows={false}
          javaScriptEnabled
          domStorageEnabled
          mediaPlaybackRequiresUserAction
          allowsInlineMediaPlayback
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#080c14" },
  container: { flex: 1, backgroundColor: "#080c14" },
  web: { flex: 1, backgroundColor: "#080c14" },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#080c14",
    zIndex: 2,
  },
});
