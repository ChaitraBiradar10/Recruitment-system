package com.git.recruitment.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.*;
import java.util.function.Function;

@Component
public class JwtUtil {
    @Value("${app.jwt.secret}") private String secret;
    @Value("${app.jwt.expiration}") private Long expiration;

    private Key getSigningKey() { return Keys.hmacShaKeyFor(secret.getBytes()); }

    public String generateToken(UserDetails userDetails, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("role", role);
        return Jwts.builder().setClaims(claims).setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256).compact();
    }

    public String extractUsername(String token) { return extractClaim(token, Claims::getSubject); }
    public String extractRole(String token) { return extractClaim(token, c -> c.get("role", String.class)); }
    public Date extractExpiration(String token) { return extractClaim(token, Claims::getExpiration); }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(Jwts.parserBuilder().setSigningKey(getSigningKey()).build()
                .parseClaimsJws(token).getBody());
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        return extractUsername(token).equals(userDetails.getUsername())
                && !extractExpiration(token).before(new Date());
    }
}
