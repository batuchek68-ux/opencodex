@@
     ], { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"], timeout: 12_000, windowsHide: true });
+    
@@
-  } catch {
-    return out;
-  }
+  } catch (error) {
+    // Log failure for diagnostics (do not leak owner data). Failing to enumerate
+    // should be non-fatal and return an empty list.
+    try {
+      console.error("listWindowsSnapshots: PowerShell enumeration failed:", error instanceof Error ? error.message : String(error));
+    } catch {}
+    return out;
+  }
*** End Patch