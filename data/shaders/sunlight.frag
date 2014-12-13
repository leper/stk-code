uniform sampler2D ntex;
uniform sampler2D ctex;
uniform sampler2D dtex;
//uniform sampler2D cloudtex;

uniform vec3 direction;
uniform vec3 col;
uniform float sunangle = .54;

//uniform int hasclouds;
//uniform vec2 wind;

out vec4 FragColor;

vec3 DecodeNormal(vec2 n);
vec3 SpecularBRDF(vec3 normal, vec3 eyedir, vec3 lightdir, vec3 color, float roughness);
vec3 DiffuseBRDF(vec3 normal, vec3 eyedir, vec3 lightdir, vec3 color, float roughness);
vec4 getPosFromUVDepth(vec3 uvDepth, mat4 InverseProjectionMatrix);

vec3 getMostRepresentativePoint(vec3 direction, vec3 R, float angularRadius)
{
    vec3 D = direction;
    float d = cos(angularRadius);
    float r = sin(angularRadius);
    float DdotR = dot(D, R);
    vec3 S = R - DdotR * D;
    return (DdotR < d) ? normalize(d * D + normalize (S) * r) : R;
}

void main() {
    vec2 uv = gl_FragCoord.xy / screen;
    float z = texture(dtex, uv).x;
    vec4 xpos = getPosFromUVDepth(vec3(uv, z), InverseProjectionMatrix);

    vec3 norm = normalize(DecodeNormal(2. * texture(ntex, uv).xy - 1.));
    vec3 color = texture(ctex, uv).xyz;
    float roughness = texture(ntex, uv).z;
    vec3 eyedir = -normalize(xpos.xyz);

    // Normalized on the cpu
    vec3 L = direction;

    float NdotL = clamp(dot(norm, L), 0., 1.);

    float angle = 3.14 * sunangle / 180.;
    vec3 R = reflect(-eyedir, norm);
    vec3 Lightdir = getMostRepresentativePoint(direction, R, angle);

    float metalness = texture(ntex, uv).a;

/*	if (hasclouds == 1)
	{
		vec2 cloudcoord = (xpos.xz * 0.00833333) + wind;
		float cloud = texture(cloudtex, cloudcoord).x;
		//float cloud = step(0.5, cloudcoord.x) * step(0.5, cloudcoord.y);

		outcol *= cloud;
	}*/

    vec3 Dielectric = DiffuseBRDF(norm, eyedir, Lightdir, color, roughness) + SpecularBRDF(norm, eyedir, Lightdir, vec3(.04), roughness);
    vec3 Metal = SpecularBRDF(norm, eyedir, Lightdir, color, roughness);
    FragColor = vec4(NdotL * col * mix(Dielectric, Metal, metalness), 0.);
}
