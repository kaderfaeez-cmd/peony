"use client";

import { CloudDrizzle, CloudSun, Cloudy, MapPin, Snowflake, Sun, Zap } from "lucide-react";
import { createElement, useEffect, useState } from "react";

interface Weather {
  temperature: number;
  code: number;
  high: number;
  low: number;
}

/** Open-Meteo needs no key and no account — a widget should not cost a signup. */
const ENDPOINT = "https://api.open-meteo.com/v1/forecast";

function iconFor(code: number) {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code <= 48) return Cloudy;
  if (code <= 67 || (code >= 80 && code <= 82)) return CloudDrizzle;
  if (code <= 77 || (code >= 85 && code <= 86)) return Snowflake;
  return Zap;
}

const WeatherGlyph = ({ code }: { code: number }) =>
  createElement(iconFor(code), { size: 22, strokeWidth: 1.4, className: "text-rose-ink" });

function describe(code: number) {
  if (code === 0) return "Clear";
  if (code <= 2) return "Mostly clear";
  if (code <= 3) return "Cloudy";
  if (code <= 48) return "Misty";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  return "Storms";
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "denied" | "error">("loading");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }

    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const url = `${ENDPOINT}?latitude=${coords.latitude.toFixed(2)}&longitude=${coords.longitude.toFixed(
            2,
          )}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto`;
          const response = await fetch(url);
          if (!response.ok) throw new Error("weather request failed");
          const data = await response.json();
          if (cancelled) return;
          setWeather({
            temperature: Math.round(data.current.temperature_2m),
            code: data.current.weather_code,
            high: Math.round(data.daily.temperature_2m_max[0]),
            low: Math.round(data.daily.temperature_2m_min[0]),
          });
          setStatus("idle");
        } catch {
          if (!cancelled) setStatus("error");
        }
      },
      () => !cancelled && setStatus("denied"),
      { maximumAge: 900_000, timeout: 8000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "denied" || status === "error") {
    return (
      <p className="flex items-center gap-2 text-[12px] text-ink-faint">
        <MapPin size={12} strokeWidth={1.7} />
        {status === "denied" ? "Location off — no weather today." : "Weather unavailable."}
      </p>
    );
  }

  if (!weather) {
    return <p className="text-[12px] text-ink-faint">Checking the sky…</p>;
  }

  return (
    <div className="flex items-center gap-3">
      <WeatherGlyph code={weather.code} />
      <div className="leading-tight">
        <p className="numeral text-[19px] text-ink">
          {weather.temperature}
          <span className="text-[12px] text-ink-faint">°C</span>
        </p>
        <p className="text-[11.5px] text-ink-soft">
          {describe(weather.code)} · {weather.low}–{weather.high}°
        </p>
      </div>
    </div>
  );
}
